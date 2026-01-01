import requests
import json
from datetime import date, timedelta

def test_validate_api():
    url = "http://localhost:8000/validate"
    
    # 測試案例 1: 合法的 Post-Completion OPT 請求
    payload = {
        "degree_level": "Master",
        "is_stem_degree": True,
        "program_end_date": "2025-05-15",
        "opt_stage": "Post",
        "unemployment_days_used": 0,
        "has_one_year_enrollment": True
    }
    
    print("--- Testing Valid Post-Completion OPT ---")
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print("Response JSON:")
            print(json.dumps(data, indent=2))
            
            # 驗證 timeline 是否存在
            if "timeline" in data and data["timeline"]:
                print("✅ Timeline calculated successfully!")
                assert data["timeline"]["earliest_filing"] == "2025-02-14"
            else:
                print("❌ Timeline missing in response!")
        else:
            print(f"❌ Failed: {response.text}")
    except Exception as e:
        print(f"Error: {e}. Is the server running?")

    # 測試案例 2: 非法的 STEM Extension 請求 (非 STEM 學位)
    invalid_payload = {
        "degree_level": "Master",
        "is_stem_degree": False,
        "program_end_date": "2025-05-15",
        "opt_stage": "STEM",
        "unemployment_days_used": 0
    }
    
    print("\n--- Testing Invalid STEM Request (Non-STEM Degree) ---")
    try:
        response = requests.post(url, json=invalid_payload)
        print(f"Status Code: {response.status_code}")
        if response.status_code == 400:
            print("✅ Correctly caught validation error:")
            print(json.dumps(response.json(), indent=2))
        else:
            print(f"❌ Should have failed with 400, but got {response.status_code}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_validate_api()
