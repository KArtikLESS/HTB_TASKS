import base64
from Crypto.Cipher import AES

key_str = "kV9qhuzZkvvrgW6F"
ciphertext_b64 = "1UlBm2kHtZuVrSE6qY6HxWkwHyeaX92DabnRFlEGyLWod2bkwAxcoc85S94kFpV1"

# 1. Ключ как UTF-8 строка (16 байт)
key = key_str.encode('utf-8')

# 2. Декодировка ciphertext из Base64
ciphertext = base64.b64decode(ciphertext_b64)

# 3. Расшифрование AES-128-ECB
cipher = AES.new(key, AES.MODE_ECB)
decrypted = cipher.decrypt(ciphertext)

# 4. Удаление padding (последний байт указывает длину)
padding_length = decrypted[-1]
if 1 <= padding_length <= 16:
    result = decrypted[:-padding_length]
else:
    result = decrypted

print(f"Флаг: {result.decode('utf-8')}")
