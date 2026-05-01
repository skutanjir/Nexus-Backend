const fs = require('fs');
const path = require('path');

function findFiles(dir, match, files = []) {
  fs.readdirSync(dir).forEach(file => {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      findFiles(fullPath, match, files);
    } else if (match.test(fullPath)) {
      files.push(fullPath);
    }
  });
  return files;
}

const reactFiles = findFiles('nexus-react/src', /\.tsx?$/);

reactFiles.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  
  // Memperbaiki pattern product.price.toLocaleString menjadi Number(product.price).toLocaleString
  let newContent = content.replace(/([a-zA-Z0-9_?.]+price)\.toLocaleString/g, 'Number($1).toLocaleString');
  
  // Kasus spesifik untuk Wishlist.tsx dimana format aslinya `product?.price?.toLocaleString(...)`
  newContent = newContent.replace(/product\?\.price\?\.toLocaleString\('id-ID'\)/g, "Number(product?.price || 0).toLocaleString('id-ID')");
  
  // Kasus pada Cart
  newContent = newContent.replace(/item\.price\.toLocaleString/g, 'Number(item.price).toLocaleString');
  
  // Kasus analytics revenue
  newContent = newContent.replace(/product\.revenue\.toLocaleString/g, 'Number(product.revenue).toLocaleString');
  
  if (content !== newContent) {
    fs.writeFileSync(file, newContent, 'utf8');
    console.log('Fixed currency in:', file);
  }
});

console.log('Formatting task complete.');