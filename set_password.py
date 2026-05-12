"""
set_password.py — Quản lý mật khẩu cho báo cáo riêng tư
=========================================================
Cách dùng:
  # Đặt mật khẩu cho 1 báo cáo (tìm theo tên file):
  python set_password.py set "pvcfc-16032026.html" "matkhau123"

  # Xóa mật khẩu (đặt lại thành công khai):
  python set_password.py remove "pvcfc-16032026.html"

  # Xem danh sách tất cả báo cáo và trạng thái:
  python set_password.py list
"""

import sys
import json
import hashlib


MANIFEST_FILE = "manifest.json"


def sha256(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8")).hexdigest()


def load_manifest():
    with open(MANIFEST_FILE, "r", encoding="utf-8") as f:
        return json.load(f)


def save_manifest(data):
    with open(MANIFEST_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=4, ensure_ascii=False)
    print(f"✅  Đã lưu {MANIFEST_FILE}")


def cmd_set(filename: str, password: str):
    data = load_manifest()
    matched = [r for r in data["reports"] if r["name"] == filename]
    if not matched:
        print(f"❌  Không tìm thấy báo cáo: '{filename}'")
        print("    Danh sách tên file hiện có:")
        for r in data["reports"]:
            print(f"      - {r['name']}")
        sys.exit(1)

    h = sha256(password)
    for report in matched:
        report["private"] = True
        report["passwordHash"] = h
    save_manifest(data)
    print(f"🔒  Đã đặt mật khẩu cho: {filename}")
    print(f"    Hash: {h}")


def cmd_remove(filename: str):
    data = load_manifest()
    matched = [r for r in data["reports"] if r["name"] == filename]
    if not matched:
        print(f"❌  Không tìm thấy báo cáo: '{filename}'")
        sys.exit(1)

    for report in matched:
        report.pop("private", None)
        report.pop("passwordHash", None)
    save_manifest(data)
    print(f"🔓  Đã xóa mật khẩu, báo cáo '{filename}' giờ là công khai.")


def cmd_list():
    data = load_manifest()
    print(f"\n{'No.':<4} {'Tên file':<45} {'Trạng thái'}")
    print("-" * 70)
    for i, r in enumerate(data["reports"], 1):
        status = "🔒 Riêng tư" if r.get("private") else "🌐 Công khai"
        print(f"{i:<4} {r['name']:<45} {status}")
    print()


if __name__ == "__main__":
    args = sys.argv[1:]
    if not args or args[0] == "list":
        cmd_list()
    elif args[0] == "set" and len(args) == 3:
        cmd_set(args[1], args[2])
    elif args[0] == "remove" and len(args) == 2:
        cmd_remove(args[1])
    else:
        print(__doc__)
        sys.exit(1)
