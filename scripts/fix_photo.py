import sqlite3

def main():
    conn = sqlite3.connect('prisma/dev.db')
    with open('scripts/photo_base64.txt', 'r') as f:
        photo = f.read().strip()
    
    cur = conn.cursor()
    cur.execute("UPDATE Attendance SET clockInPhoto = ? WHERE userId = (SELECT id FROM User WHERE email = 'ashabil@difitech.co.id') AND date = '2026-08-31'", (photo,))
    conn.commit()
    conn.close()
    print("✅ Foto CamStamp 09:54 berhasil di-update ke database!")

if __name__ == '__main__':
    main()
