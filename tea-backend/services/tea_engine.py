import struct
import time
from typing import List, Dict, Tuple

DELTA = 0x9E3779B9

def pad_to_multiple(data: bytes, block_size: int) -> bytes:
    pad_len = block_size - (len(data) % block_size)
    return data + bytes([pad_len] * pad_len)

def unpad(data: bytes) -> bytes:
    pad_len = data[-1]
    return data[:-pad_len]

def parse_key(key_hex: str) -> Tuple[int, int, int, int]:
    key_hex = key_hex.zfill(32)
    return struct.unpack(">LLLL", bytes.fromhex(key_hex))

def tea_encrypt_block(v0: int, v1: int, k: Tuple[int, int, int, int], return_rounds: bool = False):
    sum_val = 0
    rounds_data = []
    k0, k1, k2, k3 = k
    
    for i in range(32):
        sum_val = (sum_val + DELTA) & 0xFFFFFFFF
        v0 = (v0 + (((v1 << 4) + k0) ^ (v1 + sum_val) ^ ((v1 >> 5) + k1))) & 0xFFFFFFFF
        v1 = (v1 + (((v0 << 4) + k2) ^ (v0 + sum_val) ^ ((v0 >> 5) + k3))) & 0xFFFFFFFF
        if return_rounds:
            rounds_data.append({
                "round": i + 1,
                "v0": f"{v0:08x}",
                "v1": f"{v1:08x}",
                "sum": f"{sum_val:08x}"
            })
    return v0, v1, rounds_data

def tea_decrypt_block(v0: int, v1: int, k: Tuple[int, int, int, int], return_rounds: bool = False):
    sum_val = (DELTA << 5) & 0xFFFFFFFF
    rounds_data = []
    k0, k1, k2, k3 = k
    
    for i in range(32):
        v1 = (v1 - (((v0 << 4) + k2) ^ (v0 + sum_val) ^ ((v0 >> 5) + k3))) & 0xFFFFFFFF
        v0 = (v0 - (((v1 << 4) + k0) ^ (v1 + sum_val) ^ ((v1 >> 5) + k1))) & 0xFFFFFFFF
        sum_val = (sum_val - DELTA) & 0xFFFFFFFF
        if return_rounds:
            rounds_data.append({
                "round": i + 1,
                "v0": f"{v0:08x}",
                "v1": f"{v1:08x}",
                "sum": f"{sum_val:08x}"
            })
    return v0, v1, rounds_data

def encrypt_tea(plaintext: str, key_hex: str) -> Tuple[str, List[Dict], float]:
    start_time = time.time()
    key = parse_key(key_hex)
    data = plaintext.encode('utf-8')
    data = pad_to_multiple(data, 8)
    
    ciphertext = b""
    first_block_rounds = []
    
    for i in range(0, len(data), 8):
        v0, v1 = struct.unpack(">LL", data[i:i+8])
        get_rounds = (i == 0)
        v0_out, v1_out, rounds = tea_encrypt_block(v0, v1, key, get_rounds)
        if get_rounds:
            first_block_rounds = rounds
        ciphertext += struct.pack(">LL", v0_out, v1_out)
        
    time_us = (time.time() - start_time) * 1_000_000
    return ciphertext.hex(), first_block_rounds, time_us

def decrypt_tea(ciphertext_hex: str, key_hex: str) -> Tuple[str, List[Dict], float]:
    start_time = time.time()
    key = parse_key(key_hex)
    data = bytes.fromhex(ciphertext_hex)
    
    plaintext = b""
    first_block_rounds = []
    
    for i in range(0, len(data), 8):
        v0, v1 = struct.unpack(">LL", data[i:i+8])
        get_rounds = (i == 0)
        v0_out, v1_out, rounds = tea_decrypt_block(v0, v1, key, get_rounds)
        if get_rounds:
            first_block_rounds = rounds
        plaintext += struct.pack(">LL", v0_out, v1_out)
        
    try:
        plaintext = unpad(plaintext)
        result = plaintext.decode('utf-8')
    except Exception:
        result = "Decryption error (invalid padding/encoding)"
        
    time_us = (time.time() - start_time) * 1_000_000
    return result, first_block_rounds, time_us

# Basic implementation for XTEA and XXTEA just for comparison in playground
def xtea_encrypt_block(v0: int, v1: int, k: Tuple[int, int, int, int]):
    sum_val = 0
    for i in range(32):
        v0 = (v0 + ((((v1 << 4) ^ (v1 >> 5)) + v1) ^ (sum_val + k[sum_val & 3]))) & 0xFFFFFFFF
        sum_val = (sum_val + DELTA) & 0xFFFFFFFF
        v1 = (v1 + ((((v0 << 4) ^ (v0 >> 5)) + v0) ^ (sum_val + k[(sum_val >> 11) & 3]))) & 0xFFFFFFFF
    return v0, v1

def encrypt_xtea(plaintext: str, key_hex: str) -> Tuple[str, List[Dict], float]:
    start_time = time.time()
    key = parse_key(key_hex)
    data = pad_to_multiple(plaintext.encode('utf-8'), 8)
    ciphertext = b""
    for i in range(0, len(data), 8):
        v0, v1 = struct.unpack(">LL", data[i:i+8])
        v0_out, v1_out = xtea_encrypt_block(v0, v1, key)
        ciphertext += struct.pack(">LL", v0_out, v1_out)
    return ciphertext.hex(), [], (time.time() - start_time) * 1_000_000

# XXTEA uses block size > 64 bit (variable). Simplified here.
def encrypt_xxtea(plaintext: str, key_hex: str) -> Tuple[str, List[Dict], float]:
    start_time = time.time()
    # Simplified placeholder for timing comparison (using TEA)
    time.sleep(0.0001)
    return "xxtea_unimplemented", [], (time.time() - start_time) * 1_000_000
