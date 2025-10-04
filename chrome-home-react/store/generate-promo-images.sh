#!/bin/bash

# Generate Promotional Images Script

echo "🎨 Generating promotional images for Chrome Web Store..."

# Create store assets directory
mkdir -p store/assets/generated

# Function to create promotional image with text
create_promo_image() {
    local size=$1
    local filename=$2
    local title=$3
    local subtitle=$4
    
    echo "Creating $filename ($size)..."
    
    # Create gradient background with logo and text using ImageMagick
    convert -size $size xc:white \
        -sparse-color barycentric "0,0 #667eea %[fx:w-1],%[fx:h-1] #764ba2" \
        -fill white \
        -font "Helvetica-Bold" \
        -pointsize 48 \
        -gravity center \
        -annotate +0-30 "$title" \
        -font "Helvetica" \
        -pointsize 24 \
        -annotate +0+20 "$subtitle" \
        "store/assets/generated/$filename"
}

# Generate Small Promo Tile (440x280) - Required
create_promo_image "440x280" "promo-small.png" "Chrome Home" "Beautiful New Tab & Widgets"

# Generate Large Promo Tile (920x680) - Optional
create_promo_image "920x680" "promo-large.png" "Chrome Home" "Transform Your New Tab Experience"

# Generate Marquee Promo Tile (1400x560) - Optional  
create_promo_image "1400x560" "promo-marquee.png" "Chrome Home" "Stunning Backgrounds • Powerful Widgets • Lightning Fast"

# Convert SVG icons to PNG
echo "Converting SVG icons to PNG..."

# Using rsvg-convert (install with: brew install librsvg)
rsvg-convert -w 128 -h 128 public/icons/icon128.svg > store/assets/generated/icon128.png 2>/dev/null || \
    echo "Note: Install librsvg for SVG conversion (brew install librsvg)"

rsvg-convert -w 48 -h 48 public/icons/icon48.svg > store/assets/generated/icon48.png 2>/dev/null
rsvg-convert -w 16 -h 16 public/icons/icon16.svg > store/assets/generated/icon16.png 2>/dev/null

echo "✅ Promotional images generated in store/assets/generated/"
echo ""
echo "📋 Next steps:"
echo "1. Review and enhance images in image editor if needed"
echo "2. Ensure text is readable and attractive"
echo "3. Upload to Chrome Web Store"

# Alternative: Simple HTML/CSS to Image approach
cat > store/assets/promo-template.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <style>
        body {
            margin: 0;
            width: 440px;
            height: 280px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            color: white;
        }
        .logo {
            width: 80px;
            height: 80px;
            background: rgba(255,255,255,0.2);
            border-radius: 20px;
            margin-bottom: 20px;
        }
        h1 {
            margin: 0;
            font-size: 36px;
            font-weight: 700;
        }
        p {
            margin: 10px 0 0;
            font-size: 18px;
            opacity: 0.9;
        }
    </style>
</head>
<body>
    <div class="logo"></div>
    <h1>Chrome Home</h1>
    <p>Beautiful New Tab & Widgets</p>
</body>
</html>
EOF

echo ""
echo "💡 Tip: You can also open promo-template.html in browser and screenshot it"