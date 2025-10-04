import hashlib
import base64

# Token parts from the error
token_data = "eyJleHQiOiJta2VlY29wZGNlYWJsY2FtcG5obWNvYWNobmhoZ25tbiIsImZwIjoiNmQxMmVkOTg3MzlkZTAwMDVkYzE1ZjE4MmZiM2IxZTQwZjRlOThhMGNmNjZjZmY2ZjMwMjFiY2QyZjQ5ZDlmNyIsInRzIjoxNzU0ODM2NTM3LCJub25jZSI6IjhlYTg1MzYzLTJkYzQtNGIwOS1hOTY4LTY4NTM2YmMxOTZjYzhmIn0"
provided_signature = "2409e1b4450354e6792a1ae04825d0b0"
fingerprint = "6d12ed98739de0005dc15f182fb3b1e40f4e98a0cf66cff6f3021bcd2f49d9f7"

# Generate expected signature (backend method)
data_to_sign = token_data + fingerprint
hash_obj = hashlib.sha256(data_to_sign.encode())
expected_signature = hash_obj.hexdigest()[:32]

print(f"Token data: {token_data[:50]}...")
print(f"Fingerprint: {fingerprint}")
print(f"Provided signature: {provided_signature}")
print(f"Expected signature: {expected_signature}")
print(f"Signatures match: {provided_signature == expected_signature}")
