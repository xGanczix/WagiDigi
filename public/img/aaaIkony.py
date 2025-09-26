import zipfile
import os
from PIL import Image

# Nazwa pliku zip
target_zip = "mycollection.zip"
output_dir = os.getcwd()  # Folder docelowy to bieżący katalog
temp_dir = os.path.join(output_dir, "temp")
black_dir = os.path.join(output_dir, "black")
white_dir = os.path.join(output_dir, "white")
grey_dir = os.path.join(output_dir, "grey")
blue_dir = os.path.join(output_dir, "blue")
light_grey_dir = os.path.join(output_dir, "lightgrey")
green_dir = os.path.join(output_dir, "green")
red_dir = os.path.join(output_dir,"red")
iceblue_dir = os.path.join(output_dir,"iceblue")

# Tworzenie folderów jeśli nie istnieją
os.makedirs(temp_dir, exist_ok=True)
os.makedirs(black_dir, exist_ok=True)
os.makedirs(white_dir, exist_ok=True)
os.makedirs(grey_dir, exist_ok=True)
os.makedirs(blue_dir, exist_ok=True)
os.makedirs(light_grey_dir, exist_ok=True)
os.makedirs(green_dir, exist_ok=True)
os.makedirs(red_dir, exist_ok=True)
os.makedirs(iceblue_dir, exist_ok=True)

# Otwórz plik ZIP
def extract_and_rename(zip_path, temp_folder, black_folder, white_folder, grey_folder, blue_folder, light_grey_folder, green_folder, red_folder, iceblue_folder):
    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
        for file_info in zip_ref.infolist():
            if file_info.filename.startswith("png/") and len(os.path.basename(file_info.filename)) > 4:
                original_name = os.path.basename(file_info.filename)
                new_name = original_name[4:]  # Usuwanie pierwszych 4 znaków
                temp_output_path = os.path.join(temp_folder, new_name)
                
                # Wypakowanie do folderu "temp"
                with zip_ref.open(file_info.filename) as source, open(temp_output_path, 'wb') as target:
                    target.write(source.read())
                
                # Zmiana koloru na czarny (RGB(0,0,0))
                convert_to_black(temp_output_path, black_folder)
                
                # Zmiana koloru z czarnego na biały
                convert_black_to_white(temp_output_path, white_folder)
                
                # Zmiana koloru z czarnego na ciemnoszary (#222222)
                convert_black_to_grey(temp_output_path, grey_folder)
                
                # Zmiana koloru z czarnego na niebieski (#1b98ff)
                convert_black_to_blue(temp_output_path, blue_folder)
                
                # Zmiana koloru z czarnego na jasno szary (#6f6f6f)
                convert_black_to_light_grey(temp_output_path, light_grey_folder)
                
                # Zmiana koloru z czarnego na zielony (#19c684)
                convert_black_to_green(temp_output_path, green_folder)
                
                # Zmiana koloru z czarnego na czerwony (#fc3046)
                convert_black_to_red(temp_output_path, red_folder)
                
                # Zmiana koloru z czarnego na ice blue (#0dcaf0)
                convert_black_to_iceblue(temp_output_path, iceblue_folder)

def convert_to_black(image_path, black_folder):
    # Zmiana każdego piksela na kolor czarny (RGB: 0, 0, 0)
    with Image.open(image_path) as img:
        img = img.convert("RGBA")
        data = img.getdata()
        new_data = [(0, 0, 0, a) for r, g, b, a in data]  # Wszystkie piksele na czarne
        img.putdata(new_data)
        
        new_image_name = os.path.basename(image_path).replace(".png", "-black.png")
        new_image_path = os.path.join(black_folder, new_image_name)
        img.save(new_image_path)

def convert_black_to_white(image_path, white_folder):
    with Image.open(image_path) as img:
        img = img.convert("RGBA")
        data = img.getdata()
        new_data = [(255, 255, 255, a) for r, g, b, a in data]
        img.putdata(new_data)
        
        new_image_name = os.path.basename(image_path).replace(".png", "-white.png")
        new_image_path = os.path.join(white_folder, new_image_name)
        img.save(new_image_path)

def convert_black_to_grey(image_path, grey_folder):
    with Image.open(image_path) as img:
        img = img.convert("RGBA")
        data = img.getdata()
        new_data = [(34, 34, 34, a) for r, g, b, a in data]
        img.putdata(new_data)
        
        new_image_name = os.path.basename(image_path).replace(".png", "-grey.png")
        new_image_path = os.path.join(grey_folder, new_image_name)
        img.save(new_image_path)

def convert_black_to_blue(image_path, blue_folder):
    with Image.open(image_path) as img:
        img = img.convert("RGBA")
        data = img.getdata()
        new_data = [(13, 110, 253, a) for r, g, b, a in data]
        img.putdata(new_data)
        
        new_image_name = os.path.basename(image_path).replace(".png", "-blue.png")
        new_image_path = os.path.join(blue_folder, new_image_name)
        img.save(new_image_path)
        
def convert_black_to_light_grey(image_path, light_grey_folder):
    with Image.open(image_path) as img:
        img = img.convert("RGBA")
        data = img.getdata()
        new_data = [(111, 111, 111, a) for r, g, b, a in data]
        img.putdata(new_data)
        
        new_image_name = os.path.basename(image_path).replace(".png", "-lightgrey.png")
        new_image_path = os.path.join(light_grey_folder, new_image_name)
        img.save(new_image_path)
        
def convert_black_to_green(image_path, green_folder):
    with Image.open(image_path) as img:
        img = img.convert("RGBA")
        data = img.getdata()
        new_data = [(25, 198, 132, a) for r, g, b, a in data]
        img.putdata(new_data)
        
        new_image_name = os.path.basename(image_path).replace(".png", "-green.png")
        new_image_path = os.path.join(green_folder, new_image_name)
        img.save(new_image_path)
        
def convert_black_to_red(image_path, red_folder):
    with Image.open(image_path) as img:
        img = img.convert("RGBA")
        data = img.getdata()
        new_data = [(252, 48, 70, a) for r, g, b, a in data]
        img.putdata(new_data)
        
        new_image_name = os.path.basename(image_path).replace(".png", "-red.png")
        new_image_path = os.path.join(red_folder, new_image_name)
        img.save(new_image_path)
        
def convert_black_to_iceblue(image_path, iceblue_folder):
    with Image.open(image_path) as img:
        img = img.convert("RGBA")
        data = img.getdata()
        new_data = [(13, 202, 240, a) for r, g, b, a in data]
        img.putdata(new_data)
        
        new_image_name = os.path.basename(image_path).replace(".png", "-iceblue.png")
        new_image_path = os.path.join(iceblue_folder, new_image_name)
        img.save(new_image_path)        

# Rozpakowanie i zmiana nazw
extract_and_rename(target_zip, temp_dir, black_dir, white_dir, grey_dir, blue_dir, light_grey_dir, green_dir, red_dir, iceblue_dir)
