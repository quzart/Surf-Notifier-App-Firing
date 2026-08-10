import base64
from cryptography.hazmat.primitives.serialization import load_pem_private_key, Encoding, PublicFormat

with open("private_key.pem", "rb") as f:
    private_key = load_pem_private_key(f.read(), password=None)

public_key = private_key.public_key()
public_bytes = public_key.public_bytes(
    encoding=Encoding.X962,
    format=PublicFormat.UncompressedPoint,
)

b64 = base64.urlsafe_b64encode(public_bytes).rstrip(b"=").decode()
print("VITE_VAPID_PUBLIC_KEY:", b64)