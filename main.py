import serial
import cv2
import time
import easyocr
import sqlite3
import os
from datetime import datetime

# --- 🌟 โหลด Library สำหรับระบบเสียงพูด 🌟 ---
from gtts import gTTS
import pygame
import io

# ตั้งค่าระบบเสียงให้พร้อมทำงาน
pygame.mixer.init()

def speak_thai(text):
    """ฟังก์ชันแปลงข้อความเป็นเสียงพูด (ไม่ทำให้กล้องค้าง)"""
    try:
        tts = gTTS(text=text, lang='th')
        fp = io.BytesIO()
        tts.write_to_fp(fp)
        fp.seek(0)
        pygame.mixer.music.load(fp)
        pygame.mixer.music.play() # สั่งเล่นเสียงแบบ Non-blocking
    except Exception as e:
        print(f"[AUDIO ERROR] {e}")

CAPTURES_DIR = './parkingweb/public/captures'
os.makedirs(CAPTURES_DIR, exist_ok=True)

print("[SYSTEM] Loading AI Model into Memory (RAM)...")
reader = easyocr.Reader(['th', 'en']) 
print("[SYSTEM] AI Model Loaded Successfully!")

DB_PATH = './parkingweb/prisma/dev.db'
try:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.isolation_level = None 
    print(f"[SYSTEM] Connected to Shared Database: {DB_PATH}")
except Exception as e:
    print(f"[ERROR] Database connection failed: {e}")
    exit()

COM_PORT = 'COM3' 
BAUD_RATE = 115200

try:
    arduino = serial.Serial(COM_PORT, BAUD_RATE, timeout=0.1)
    time.sleep(2) 
    print(f"[SYSTEM] Connected to Arduino on {COM_PORT}")
except Exception as e:
    print(f"[ERROR] Cannot connect to Arduino: {e}")
    exit()

cap = cv2.VideoCapture(0)
cap.set(cv2.CAP_PROP_FRAME_WIDTH, 640)
cap.set(cv2.CAP_PROP_FRAME_HEIGHT, 480)

print("\n[SYSTEM] ALL READY! Waiting for car...")

last_plate = ""
last_detect_time = 0

while True:
    ret, frame = cap.read()
    if not ret: continue

    if arduino.in_waiting > 0:
        raw_msg = arduino.readline()
        try:
            msg = raw_msg.decode('utf-8').strip()
            
            if msg == "TRIGGER_CAMERA":
                print("\n[EVENT] Car Detected! Capturing Plate...")
                start_time = time.time()
                
                timestamp_str = datetime.now().strftime("%Y%m%d_%H%M%S")
                image_filename = f"capture_{timestamp_str}.jpg"
                save_path = os.path.join(CAPTURES_DIR, image_filename)
                cv2.imwrite(save_path, frame)
                web_image_url = f"/captures/{image_filename}"
                
                results = reader.readtext(frame)
                
                is_authorized = False
                detected_text = ""
                matched_plate = "UNKNOWN"
                owner_name = None
                
                cursor = conn.cursor()
                
                for (bbox, text, prob) in results:
                    clean_text = text.strip().replace(" ", "").upper()
                    detected_text += f"[{clean_text}] "
                    
                    cursor.execute("SELECT ownerName FROM AuthorizedPlate WHERE plateNumber = ? COLLATE NOCASE", (clean_text,))
                    result = cursor.fetchone()
                    
                    if result:
                        is_authorized = True
                        matched_plate = clean_text
                        owner_name = result[0]
                        break 
                
                if not is_authorized and len(results) > 0:
                    matched_plate = results[0][1].strip().replace(" ", "").upper()

                cursor.close()

                current_time = time.time()
                if matched_plate == last_plate and (current_time - last_detect_time) < 2.0:
                    os.remove(save_path)
                    print(f"[SYSTEM] Duplicate plate [{matched_plate}] within 2s. Skipped.")
                    continue 
                
                last_plate = matched_plate
                last_detect_time = current_time

                status_str = "AUTHORIZED" if is_authorized else "DENIED"
                
                try:
                    cursor = conn.cursor()
                    cursor.execute(
                        "INSERT INTO AccessLog (plateNumber, ownerName, status, imagePath) VALUES (?, ?, ?, ?)",
                        (matched_plate, owner_name, status_str, web_image_url)
                    )
                    cursor.close()
                except Exception as db_err:
                    print(f"[ERROR] Database Insert Failed: {db_err}")
                
                process_time = time.time() - start_time
                print(f"-> Detected Texts: {detected_text} (Took {process_time:.2f}s)")
                
                # --- 🌟 ระบบประมวลผลคำสั่งเปิดประตู + เสียงพูด 🌟 ---
                if is_authorized:
                    print(f"[AUTH] Access Granted! Owner: {owner_name}. Sending OPEN.")
                    # ทักทายด้วยชื่อเจ้าของรถ
                    speak_thai(f"สวัสดีค่ะคุณ {owner_name} อนุญาตให้ผ่านได้ค่ะ")
                    arduino.write(b'1')
                else:
                    print(f"[AUTH] Access Denied! Logged as {status_str}.")
                    # แจ้งเตือนเมื่อไม่พบข้อมูล
                    speak_thai("ไม่อนุญาตให้เข้าค่ะ ทะเบียนรถไม่ถูกต้อง")
                    
            elif msg != "":
                if "System Ready" not in msg:
                    print(f"[ARDUINO]: {msg}")
                
        except UnicodeDecodeError:
            pass

    cv2.imshow("Gate Camera", frame)
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
arduino.close()
conn.close()