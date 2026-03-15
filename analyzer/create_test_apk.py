import zipfile
import xml.etree.ElementTree as ET

# Create a simple APK for testing
with zipfile.ZipFile('test.apk', 'w') as apk:
    apk.writestr('AndroidManifest.xml', open('test-manifest.txt').read())
