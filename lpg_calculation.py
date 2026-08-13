TARE_WEIGHT = 15.3
FULL_LPG = 14.2

total_weight = float(input("Enter load cell weight (kg): "))

lpg_weight = total_weight - TARE_WEIGHT

# Prevent invalid values
if lpg_weight < 0:
    lpg_weight = 0

if lpg_weight > FULL_LPG:
    lpg_weight = FULL_LPG

percentage = (lpg_weight / FULL_LPG) * 100

print("\n--- SMART LPG MONITOR ---")
print("Total Weight :", total_weight, "kg")
print("LPG Remaining:", round(lpg_weight, 2), "kg")
print("LPG Level    :", round(percentage, 1), "%")

if percentage <= 10:
    print("Status       : CRITICAL - Book Refill")
elif percentage <= 25:
    print("Status       : LOW")
else:
    print("Status       : NORMAL")