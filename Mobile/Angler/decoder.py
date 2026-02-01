encrypted = list("@|uqcu0t\u007f~7d0{y||0}u1\u001aY7||0du||0i\u007fe0gxubu0dxu0v|qw0yc>")

# XOR каждого символа с 16
decrypted_chars = []
for c in encrypted:
    decrypted_chars.append(chr(ord(c) ^ 16))

result = ''.join(decrypted_chars)
print("Результат:", result)

# XDR
xdr_result = ''.join(chr(ord(c) ^ 16) for c in "XDR")
print("XDR ->", xdr_result)