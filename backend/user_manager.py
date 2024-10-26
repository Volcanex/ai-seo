import os

BASE_DIR = 'user_files'

def get_user_model_path(user_id: str, model_id: str = None) -> str:
    user_dir = os.path.join(BASE_DIR, user_id, 'models')
    os.makedirs(user_dir, exist_ok=True)
    
    if model_id:
        return os.path.join(user_dir, f"{model_id}.json")
    return user_dir