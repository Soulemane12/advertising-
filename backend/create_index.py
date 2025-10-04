#!/usr/bin/env python3
"""
Script to create a TwelveLabs index for video analysis
Run this once to set up your index, then update .env.local with the index ID
"""

import os
import requests
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv("../.env.local")

TL_API = "https://api.twelvelabs.io/v1.3"
TL_KEY = os.environ.get("TL_API_KEY", "")

def create_index():
    """Create a new TwelveLabs index for video analysis"""

    if not TL_KEY or TL_KEY == "xxx":
        print("❌ Error: TL_API_KEY not set or still set to 'xxx'")
        print("💡 Please update .env.local with your actual TwelveLabs API key")
        return None

    print("🔧 Creating TwelveLabs index for video analysis...")
    print(f"🔑 Using API key: {TL_KEY[:10]}...")

    # Index configuration optimized for advertising content analysis
    index_config = {
        "index_name": "advertising-video-analysis",
        "engines": [
            {
                "engine_name": "marengo2.6",  # Visual analysis
                "engine_options": ["visual", "conversation", "text_in_video", "logo"]
            },
            {
                "engine_name": "pegasus1.1",  # Text/speech analysis
                "engine_options": ["conversation", "text_in_video"]
            }
        ],
        "addons": ["thumbnail"]  # Generate thumbnails for scenes
    }

    headers = {
        "x-api-key": TL_KEY,
        "Content-Type": "application/json"
    }

    try:
        print("📡 Sending request to TwelveLabs API...")
        response = requests.post(
            f"{TL_API}/indexes",
            headers=headers,
            json=index_config,
            timeout=30
        )

        print(f"📊 Response status: {response.status_code}")

        if response.ok:
            index_data = response.json()
            index_id = index_data["_id"]

            print("✅ Index created successfully!")
            print(f"📋 Index ID: {index_id}")
            print(f"📝 Index Name: {index_data.get('index_name', 'N/A')}")
            print(f"🔧 Engines: {[eng.get('engine_name', 'N/A') for eng in index_data.get('engines', [])]}")

            # Update .env.local file
            update_env_file(index_id)

            return index_id

        else:
            print("❌ Failed to create index")
            print(f"📄 Response: {response.text}")

            # Try to parse error details
            try:
                error_data = response.json()
                if "message" in error_data:
                    print(f"🔍 Error: {error_data['message']}")
            except:
                pass

            return None

    except requests.exceptions.RequestException as e:
        print(f"❌ Network error: {e}")
        return None
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return None

def update_env_file(index_id):
    """Update .env.local with the new index ID"""

    env_file_path = "../.env.local"

    try:
        # Read current content
        with open(env_file_path, 'r') as f:
            content = f.read()

        # Replace the index ID line
        lines = content.split('\n')
        updated_lines = []

        for line in lines:
            if line.startswith('TL_INDEX_ID='):
                updated_lines.append(f'TL_INDEX_ID={index_id}')
                print(f"📝 Updated TL_INDEX_ID in .env.local")
            else:
                updated_lines.append(line)

        # Write back to file
        with open(env_file_path, 'w') as f:
            f.write('\n'.join(updated_lines))

        print("✅ .env.local updated successfully!")

    except Exception as e:
        print(f"⚠️  Could not update .env.local automatically: {e}")
        print(f"💡 Please manually update TL_INDEX_ID={index_id} in .env.local")

def check_existing_indexes():
    """Check if any indexes already exist"""

    if not TL_KEY or TL_KEY == "xxx":
        return False

    headers = {"x-api-key": TL_KEY}

    try:
        response = requests.get(f"{TL_API}/indexes", headers=headers, timeout=10)

        if response.ok:
            indexes = response.json()

            if indexes.get("data"):
                print("📋 Existing indexes found:")
                for i, idx in enumerate(indexes["data"], 1):
                    print(f"   {i}. {idx.get('index_name', 'Unnamed')} (ID: {idx['_id']})")

                print(f"\n🤔 You have {len(indexes['data'])} existing index(es).")
                print("💡 For this demo, we'll use the first existing index.")
                print("✅ This will save time and API quota!")

                # Automatically use the first existing index
                selected_idx = indexes["data"][0]
                update_env_file(selected_idx["_id"])
                print(f"🎯 Using existing index: {selected_idx.get('index_name', 'Unnamed')}")
                print(f"📋 Index ID: {selected_idx['_id']}")
                return True

            else:
                print("📋 No existing indexes found")

    except Exception as e:
        print(f"⚠️  Could not check existing indexes: {e}")

    return False

def main():
    print("🎬 TwelveLabs Index Setup")
    print("=" * 40)

    # Check for existing indexes first
    if check_existing_indexes():
        return

    # Create new index
    index_id = create_index()

    if index_id:
        print("\n🎉 Setup complete!")
        print("🚀 You can now run the backend server:")
        print("   python backend/run.py")
        print("\n📱 And start the frontend:")
        print("   npm run dev")
    else:
        print("\n❌ Setup failed. Please check your API key and try again.")

if __name__ == "__main__":
    main()