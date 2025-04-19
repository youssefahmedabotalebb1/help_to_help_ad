// تكوين Firebase
const firebaseConfig = {
  databaseURL: "https://whatsbesnes-default-rtdb.firebaseio.com/",
  storageBucket: "whatsbesnes.appspot.com"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.database();
const storage = firebase.storage();

// بيانات تسجيل الدخول (لأغراض العرض فقط - في التطبيق الفعلي استخدم Firebase Authentication)
const adminCredentials = {
  username: "HERO_X",
  password: "456456"
};

// تعريف فئات المنتجات والبادئات
const categories = {
  "moater": "dolab",
  "molame": "rham",
  "monazef": "zgag",
  "enaya": "kalb",
  "Other": "wath",
};

// متغيرات عامة
let allProducts = [];
let productToDelete = null;

// ----- وظائف تسجيل الدخول -----
document.getElementById('loginBtn').addEventListener('click', handleLogin);

function handleLogin() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const errorElement = document.getElementById('loginError');
  
  if (username === adminCredentials.username && password === adminCredentials.password) {
    document.getElementById('loginContainer').classList.add('hidden');
    document.getElementById('adminPanel').classList.remove('hidden');
    loadAllProducts();
  } else {
    errorElement.textContent = 'اسم المستخدم أو كلمة المرور غير صحيحة';
  }
}

// ----- وظائف التنقل بين الأقسام -----
document.getElementById('viewProductsBtn').addEventListener('click', showProductsSection);
document.getElementById('addProductBtn').addEventListener('click', showAddProductSection);

function showProductsSection() {
  document.getElementById('viewProductsBtn').classList.add('active');
  document.getElementById('addProductBtn').classList.remove('active');
  document.getElementById('viewProductsSection').classList.remove('hidden');
  document.getElementById('addProductSection').classList.add('hidden');
  document.getElementById('editProductSection').classList.add('hidden');
  loadAllProducts();
}

function showAddProductSection() {
  document.getElementById('viewProductsBtn').classList.remove('active');
  document.getElementById('addProductBtn').classList.add('active');
  document.getElementById('viewProductsSection').classList.add('hidden');
  document.getElementById('addProductSection').classList.remove('hidden');
  document.getElementById('editProductSection').classList.add('hidden');
  
  // إعادة تعيين نموذج إضافة منتج
  document.getElementById('productForm').reset();
  document.getElementById('imagePreview').innerHTML = '';
}

function showEditProductSection() {
  document.getElementById('viewProductsBtn').classList.remove('active');
  document.getElementById('addProductBtn').classList.remove('active');
  document.getElementById('viewProductsSection').classList.add('hidden');
  document.getElementById('addProductSection').classList.add('hidden');
  document.getElementById('editProductSection').classList.remove('hidden');
}

// ----- وظائف تحميل وعرض المنتجات -----
async function loadAllProducts() {
  const productsList = document.getElementById('productsList');
  productsList.innerHTML = '<div class="loading">جاري تحميل المنتجات...</div>';
  
  allProducts = [];
  
  try {
    for (let path in categories) {
      const prefix = categories[path];
      const snapshot = await db.ref(path).once("value");
      const data = snapshot.val() || {};
      
      for (let id in data) {
        const item = data[id];
        allProducts.push({
          id: id,
          path: path,
          prefix: prefix,
          image: item[`${prefix}_photo`] || "",
          title: item[`${prefix}_titel`] || "منتج بدون اسم",
          description: item[`${prefix}_waf`] || item[`agng_waf`] || item[`Kalb_wat`] || "",
          price: parseFloat(item[`${prefix}_price`] || 0),
          originalData: item
        });
      }
    }
    
    renderProducts(allProducts);
  } catch (error) {
    console.error("خطأ في تحميل المنتجات:", error);
    productsList.innerHTML = '<div class="error">حدث خطأ أثناء تحميل المنتجات</div>';
  }
}

function renderProducts(products) {
  const productsList = document.getElementById('productsList');
  
  if (products.length === 0) {
    productsList.innerHTML = '<div class="no-products">لا توجد منتجات</div>';
    return;
  }
  
  productsList.innerHTML = '';
  
  products.forEach(product => {
    const productCard = document.createElement('div');
    productCard.className = 'product-card';
    productCard.innerHTML = `
      <div class="product-image">
        <img src="${product.image}" alt="${product.title}">
      </div>
      <div class="product-details">
        <h3 class="product-title">${product.title}</h3>
        <p class="product-description">${product.description.substring(0, 50)}${product.description.length > 50 ? '...' : ''}</p>
        <p class="product-price">${product.price} جنيه</p>
        <div class="product-actions">
          <button class="edit-btn" data-id="${product.id}" data-path="${product.path}">تعديل</button>
          <button class="delete-btn" data-id="${product.id}" data-path="${product.path}">حذف</button>
        </div>
      </div>
    `;
    
    // إضافة مستمعي الأحداث للأزرار
    productCard.querySelector('.edit-btn').addEventListener('click', () => editProduct(product));
    productCard.querySelector('.delete-btn').addEventListener('click', () => showDeleteConfirmation(product));
    
    productsList.appendChild(productCard);
  });
}

// ----- وظائف البحث والتصفية -----
document.getElementById('searchProductInput').addEventListener('input', filterProducts);
document.getElementById('categoryFilter').addEventListener('change', filterProducts);

function filterProducts() {
  const searchTerm = document.getElementById('searchProductInput').value.toLowerCase();
  const categoryFilter = document.getElementById('categoryFilter').value;
  
  let filteredProducts = allProducts;
  
  // تصفية حسب النص المدخل
  if (searchTerm) {
    filteredProducts = filteredProducts.filter(product => 
      product.title.toLowerCase().includes(searchTerm) || 
      product.description.toLowerCase().includes(searchTerm)
    );
  }
  
  // تصفية حسب الفئة
  if (categoryFilter !== 'all') {
    filteredProducts = filteredProducts.filter(product => product.path === categoryFilter);
  }
  
  renderProducts(filteredProducts);
}

// ----- وظائف معاينة الصور -----
document.getElementById('productImage').addEventListener('change', previewImage);
document.getElementById('editProductImage').addEventListener('change', previewEditImage);

function previewImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById('imagePreview');
    preview.innerHTML = `<img src="${e.target.result}" alt="معاينة الصورة">`;
  };
  reader.readAsDataURL(file);
}

function previewEditImage(event) {
  const file = event.target.files[0];
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = function(e) {
    const preview = document.getElementById('currentProductImage');
    preview.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

// ----- وظائف إضافة منتج جديد -----
document.getElementById('productForm').addEventListener('submit', addNewProduct);
document.getElementById('cancelProductBtn').addEventListener('click', showProductsSection);

async function addNewProduct(event) {
  event.preventDefault();
  
  // الحصول على بيانات المنتج
  const category = document.getElementById('productCategory').value;
  const title = document.getElementById('productTitle').value;
  const description = document.getElementById('productDescription').value;
  const price = parseFloat(document.getElementById('productPrice').value);
  const imageFile = document.getElementById('productImage').files[0];
  
  if (!imageFile) {
    alert('يرجى اختيار صورة للمنتج');
    return;
  }
  
  try {
    // تغيير زر الإضافة إلى حالة التحميل
    const saveButton = document.getElementById('saveProductBtn');
    saveButton.disabled = true;
    saveButton.textContent = 'جاري الحفظ...';
    
    // رفع الصورة إلى Firebase Storage
    const prefix = categories[category];
    const timestamp = new Date().getTime();
    const imageRef = storage.ref(`products/${category}/${timestamp}_${imageFile.name}`);
    
    await imageRef.put(imageFile);
    const imageUrl = await imageRef.getDownloadURL();
    
    // إعداد بيانات المنتج
    const productData = {};
    productData[`${prefix}_titel`] = title;
    productData[`${prefix}_waf`] = description;
    productData[`${prefix}_price`] = price;
    productData[`${prefix}_photo`] = imageUrl;
    
    // إضافة المنتج إلى قاعدة البيانات
    const newProductRef = db.ref(category).push();
    await newProductRef.set(productData);
    
    // إعادة تعيين النموذج والعودة إلى قائمة المنتجات
    document.getElementById('productForm').reset();
    document.getElementById('imagePreview').innerHTML = '';
    
    alert('تمت إضافة المنتج بنجاح');
    showProductsSection();
  } catch (error) {
    console.error("خطأ في إضافة المنتج:", error);
    alert('حدث خطأ أثناء إضافة المنتج');
  } finally {
    // إعادة زر الإضافة إلى حالته الطبيعية
    const saveButton = document.getElementById('saveProductBtn');
    saveButton.disabled = false;
    saveButton.textContent = 'حفظ المنتج';
  }
}

// ----- وظائف تعديل المنتج -----
document.getElementById('editProductForm').addEventListener('submit', updateProduct);
document.getElementById('cancelEditBtn').addEventListener('click', showProductsSection);

function editProduct(product) {
  // ملء نموذج التعديل ببيانات المنتج
  document.getElementById('editProductId').value = product.id;
  document.getElementById('editProductPath').value = product.path;
  document.getElementById('editProductTitle').value = product.title;
  document.getElementById('editProductDescription').value = product.description;
  document.getElementById('editProductPrice').value = product.price;
  document.getElementById('currentProductImage').src = product.image;
  
  showEditProductSection();
}

async function updateProduct(event) {
  event.preventDefault();
  
  // الحصول على بيانات المنتج المحدثة
  const productId = document.getElementById('editProductId').value;
  const productPath = document.getElementById('editProductPath').value;
  const title = document.getElementById('editProductTitle').value;
  const description = document.getElementById('editProductDescription').value;
  const price = parseFloat(document.getElementById('editProductPrice').value);
  const imageFile = document.getElementById('editProductImage').files[0];
  
  try {
    // تغيير زر التحديث إلى حالة التحميل
    const updateButton = document.getElementById('updateProductBtn');
    updateButton.disabled = true;
    updateButton.textContent = 'جاري التحديث...';
    
    const prefix = categories[productPath];
    const productRef = db.ref(`${productPath}/${productId}`);
    
    // الحصول على البيانات الحالية للمنتج
    const snapshot = await productRef.once("value");
    const currentData = snapshot.val() || {};
    
    // تحديث البيانات
    const updates = {};
    updates[`${prefix}_titel`] = title;
    updates[`${prefix}_waf`] = description;
    updates[`${prefix}_price`] = price;
    
    // تحديث الصورة إذا تم اختيار صورة جديدة
    if (imageFile) {
      const timestamp = new Date().getTime();
      const imageRef = storage.ref(`products/${productPath}/${timestamp}_${imageFile.name}`);
      
      await imageRef.put(imageFile);
      const imageUrl = await imageRef.getDownloadURL();
      
      updates[`${prefix}_photo`] = imageUrl;
    }
    
    // حفظ التحديثات في قاعدة البيانات
    await productRef.update(updates);
    
    alert('تم تحديث المنتج بنجاح');
    showProductsSection();
  } catch (error) {
    console.error("خطأ في تحديث المنتج:", error);
    alert('حدث خطأ أثناء تحديث المنتج');
  } finally {
    // إعادة زر التحديث إلى حالته الطبيعية
    const updateButton = document.getElementById('updateProductBtn');
    updateButton.disabled = false;
    updateButton.textContent = 'تحديث المنتج';
  }
}

// ----- وظائف حذف المنتج -----
document.getElementById('confirmDeleteBtn').addEventListener('click', deleteProduct);
document.getElementById('cancelDeleteBtn').addEventListener('click', closeDeleteModal);

function showDeleteConfirmation(product) {
  productToDelete = product;
  document.getElementById('deleteConfirmModal').classList.remove('hidden');
}

function closeDeleteModal() {
  document.getElementById('deleteConfirmModal').classList.add('hidden');
  productToDelete = null;
}

async function deleteProduct() {
  if (!productToDelete) return;
  
  try {
    // حذف المنتج من قاعدة البيانات
    await db.ref(`${productToDelete.path}/${productToDelete.id}`).remove();
    
    alert('تم حذف المنتج بنجاح');
    closeDeleteModal();
    loadAllProducts();
  } catch (error) {
    console.error("خطأ في حذف المنتج:", error);
    alert('حدث خطأ أثناء حذف المنتج');
  }
}

// بدء تشغيل التطبيق
document.addEventListener('DOMContentLoaded', function() {
  // التطبيق يبدأ بعرض شاشة تسجيل الدخول
});