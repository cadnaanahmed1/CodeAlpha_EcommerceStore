// DOM Elements
const productsContainer = document.getElementById('products-container');
const cartBtn = document.getElementById('cart-btn');
const cartModal = document.getElementById('cart-modal');
const loginBtn = document.getElementById('login-btn');
const authModal = document.getElementById('auth-modal');
const productModal = document.getElementById('product-modal');
const checkoutModal = document.getElementById('checkout-modal');
const confirmationModal = document.getElementById('confirmation-modal');
const cartCount = document.getElementById('cart-count');
const searchInput = document.getElementById('search-input');
const categoryFilter = document.getElementById('category-filter');
const loginTab = document.getElementById('login-tab');
const registerTab = document.getElementById('register-tab');
const loginForm = document.getElementById('login-form');
const registerForm = document.getElementById('register-form');
const checkoutBtn = document.getElementById('checkout-btn');
const placeOrderBtn = document.getElementById('place-order-btn');
const continueShoppingBtn = document.getElementById('continue-shopping-btn');
const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
const mainNav = document.querySelector('.main-nav');
const navLinks = document.querySelectorAll('.main-nav ul li a');
const addProductBtn = document.getElementById('add-product-btn');
const addProductModal = document.getElementById('add-product-modal');
const addProductForm = document.getElementById('add-product-form');

// Close buttons
const closeButtons = document.querySelectorAll('.close');

// Product detail elements
const modalProductName = document.getElementById('modal-product-name');
const modalProductCategory = document.getElementById('modal-product-category');
const modalProductDescription = document.getElementById('modal-product-description');
const modalProductPrice = document.getElementById('modal-product-price');
const modalProductImage = document.getElementById('modal-product-image');
const addToCartBtn = document.getElementById('add-to-cart-btn');
const decreaseQtyBtn = document.getElementById('decrease-qty');
const increaseQtyBtn = document.getElementById('increase-qty');
const productQuantityInput = document.getElementById('product-quantity');

// Cart elements
const cartItemsContainer = document.getElementById('cart-items');
const cartTotalElement = document.getElementById('cart-total');

// Checkout elements
const checkoutItemsContainer = document.getElementById('checkout-items');
const checkoutTotalElement = document.getElementById('checkout-total');

// Confirmation elements
const orderIdElement = document.getElementById('order-id');

// State
let products = [];
let cart = [];
let currentUser = null;
let authToken = null; // Store token separately
let currentProduct = null;

// API URL - Using your Render server
const API_URL = 'https://codealpha-ecommercestore.onrender.com/api';

// Initialize the app
document.addEventListener('DOMContentLoaded', () => {
    // Check for stored token in localStorage
    const storedToken = localStorage.getItem('authToken');
    const storedUser = localStorage.getItem('currentUser');
    
    if (storedToken && storedUser) {
        authToken = storedToken;
        currentUser = JSON.parse(storedUser);
        loginBtn.innerHTML = '<i class="fas fa-user-check"></i>';
    }
    
    fetchProducts();
    setupEventListeners();
    updateCartUI();
});

// Setup event listeners
function setupEventListeners() {
    // Mobile menu toggle
    mobileMenuBtn.addEventListener('click', () => {
        mainNav.classList.toggle('active');
    });
    
    // Navigation links
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Remove active class from all links
            navLinks.forEach(l => l.classList.remove('active'));
            
            // Add active class to clicked link
            link.classList.add('active');
            
            // Close mobile menu if open
            if (mainNav.classList.contains('active')) {
                mainNav.classList.remove('active');
            }
            
            // Handle navigation based on link text
            const linkText = link.textContent.trim();
            handleNavigation(linkText);
        });
    });

    // Modal close buttons
    closeButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            e.stopPropagation();
            const modal = button.closest('.modal');
            if (modal) {
                modal.style.display = 'none';
            }
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });

    // Cart button
    cartBtn.addEventListener('click', () => {
        cartModal.style.display = 'block';
        renderCartItems();
    });

    // Login button
    loginBtn.addEventListener('click', () => {
        authModal.style.display = 'block';
    });

    // Add Product button
    addProductBtn.addEventListener('click', () => {
        addProductModal.style.display = 'block';
    });

    // Add Product form submission
    addProductForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const productData = {
            name: document.getElementById('product-name').value,
            description: document.getElementById('product-description').value,
            price: parseFloat(document.getElementById('product-price').value),
            category: document.getElementById('product-category').value,
            image: document.getElementById('product-image').value
        };
        
        try {
            const response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(productData)
            });
            
            if (!response.ok) throw new Error('Failed to add product');
            
            const newProduct = await response.json();
            
            // Add the new product to the products array
            products.push(newProduct);
            
            // Re-render products
            renderProducts(products);
            
            // Close modal and reset form
            addProductModal.style.display = 'none';
            addProductForm.reset();
            
            showNotification('Product added successfully!');
        } catch (error) {
            console.error('Error adding product:', error);
            showNotification('Failed to add product. Please try again.', 'error');
        }
    });

    // Auth tabs
    loginTab.addEventListener('click', () => {
        loginTab.classList.add('active');
        registerTab.classList.remove('active');
        loginForm.style.display = 'block';
        registerForm.style.display = 'none';
    });

    registerTab.addEventListener('click', () => {
        registerTab.classList.add('active');
        loginTab.classList.remove('active');
        loginForm.style.display = 'none';
        registerForm.style.display = 'block';
    });

    // Auth forms
    loginForm.addEventListener('submit', handleLogin);
    registerForm.addEventListener('submit', handleRegister);

    // Product quantity buttons
    decreaseQtyBtn.addEventListener('click', () => {
        const currentValue = parseInt(productQuantityInput.value);
        if (currentValue > 1) {
            productQuantityInput.value = currentValue - 1;
        }
    });

    increaseQtyBtn.addEventListener('click', () => {
        const currentValue = parseInt(productQuantityInput.value);
        productQuantityInput.value = currentValue + 1;
    });

    // Add to cart button
    addToCartBtn.addEventListener('click', () => {
        if (currentProduct) {
            const quantity = parseInt(productQuantityInput.value);
            addToCart(currentProduct, quantity);
            productModal.style.display = 'none';
        }
    });

    // Search and filter
    searchInput.addEventListener('input', filterProducts);
    categoryFilter.addEventListener('change', filterProducts);

    // Checkout button
    checkoutBtn.addEventListener('click', () => {
        if (cart.length === 0) {
            alert('Your cart is empty!');
            return;
        }
        
        cartModal.style.display = 'none';
        checkoutModal.style.display = 'block';
        renderCheckoutItems();
        
        // Pre-fill checkout form if user is logged in
        if (currentUser) {
            document.getElementById('checkout-name').value = currentUser.name || '';
            document.getElementById('checkout-address').value = currentUser.address || '';
            document.getElementById('checkout-city').value = currentUser.city || '';
            document.getElementById('checkout-zip').value = currentUser.zip || '';
        }
    });

    // Place order button
    placeOrderBtn.addEventListener('click', handlePlaceOrder);

    // Continue shopping button
    continueShoppingBtn.addEventListener('click', () => {
        confirmationModal.style.display = 'none';
    });
}

// Handle navigation
function handleNavigation(linkText) {
    switch(linkText) {
        case 'Home':
            window.scrollTo({ top: 0, behavior: 'smooth' });
            break;
        case 'Products':
            const productsSection = document.querySelector('.products-section');
            if (productsSection) {
                productsSection.scrollIntoView({ behavior: 'smooth' });
            }
            break;
        case 'About':
            // Since we don't have an About section, we'll show a notification
            showNotification('About page coming soon!', 'info');
            break;
        case 'Contact':
            // Since we don't have a Contact section, we'll show a notification
            showNotification('Contact page coming soon!', 'info');
            break;
        default:
            console.log('Unknown navigation link:', linkText);
    }
}

// Fetch products from the server
async function fetchProducts() {
    try {
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        products = await response.json();
        renderProducts(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        productsContainer.innerHTML = '<p class="error-message">Failed to load products. Please try again later.</p>';
    }
}

// Render products
function renderProducts(productsToRender) {
    productsContainer.innerHTML = '';
    
    if (productsToRender.length === 0) {
        productsContainer.innerHTML = '<p class="no-products">No products found.</p>';
        return;
    }
    
    productsToRender.forEach(product => {
        const productCard = document.createElement('div');
        productCard.className = 'product-card';
        productCard.innerHTML = `
            <div class="product-image">
                <img src="${product.image}" alt="${product.name}">
            </div>
            <div class="product-info">
                <div class="product-category">${product.category}</div>
                <h3 class="product-name">${product.name}</h3>
                <div class="product-price">$${product.price.toFixed(2)}</div>
                <div class="product-actions">
                    <button class="view-details-btn" data-id="${product._id}">View Details</button>
                    <button class="add-to-cart-small" data-id="${product._id}">Add to Cart</button>
                    <button class="delete-product-btn" data-id="${product._id}"><i class="fas fa-trash"></i></button>
                </div>
            </div>
        `;
        
        productsContainer.appendChild(productCard);
        
        // Add event listeners to buttons
        const viewDetailsBtn = productCard.querySelector('.view-details-btn');
        const addToCartSmallBtn = productCard.querySelector('.add-to-cart-small');
        const deleteProductBtn = productCard.querySelector('.delete-product-btn');
        
        viewDetailsBtn.addEventListener('click', () => {
            showProductDetails(product);
        });
        
        addToCartSmallBtn.addEventListener('click', () => {
            addToCart(product, 1);
        });
        
        deleteProductBtn.addEventListener('click', () => {
            deleteProduct(product._id);
        });
    });
}

// Delete a product
async function deleteProduct(productId) {
    if (!confirm('Are you sure you want to delete this product?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${authToken}`
            }
        });
        
        if (!response.ok) throw new Error('Failed to delete product');
        
        // Remove the product from the products array
        products = products.filter(product => product._id !== productId);
        
        // Re-render products
        renderProducts(products);
        
        showNotification('Product deleted successfully!');
    } catch (error) {
        console.error('Error deleting product:', error);
        showNotification('Failed to delete product. Please try again.', 'error');
    }
}

// Filter products based on search and category
function filterProducts() {
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;
    
    const filteredProducts = products.filter(product => {
        const matchesSearch = product.name.toLowerCase().includes(searchTerm) || 
                              product.description.toLowerCase().includes(searchTerm);
        const matchesCategory = !selectedCategory || product.category === selectedCategory;
        
        return matchesSearch && matchesCategory;
    });
    
    renderProducts(filteredProducts);
}

// Show product details in modal
function showProductDetails(product) {
    currentProduct = product;
    modalProductName.textContent = product.name;
    modalProductCategory.textContent = product.category;
    modalProductDescription.textContent = product.description;
    modalProductPrice.textContent = `$${product.price.toFixed(2)}`;
    modalProductImage.src = product.image;
    productQuantityInput.value = 1;
    
    productModal.style.display = 'block';
}

// Add product to cart
function addToCart(product, quantity) {
    const existingItem = cart.find(item => item.product._id === product._id);
    
    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        cart.push({
            product,
            quantity
        });
    }
    
    updateCartUI();
    showNotification(`${product.name} added to cart!`);
}

// Update cart UI
function updateCartUI() {
    // Update cart count
    const totalItems = cart.reduce((total, item) => total + item.quantity, 0);
    cartCount.textContent = totalItems;
    
    // Update cart total
    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    cartTotalElement.textContent = `$${total.toFixed(2)}`;
}

// Render cart items
function renderCartItems() {
    cartItemsContainer.innerHTML = '';
    
    if (cart.length === 0) {
        cartItemsContainer.innerHTML = '<p class="empty-cart">Your cart is empty.</p>';
        return;
    }
    
    cart.forEach((item, index) => {
        const cartItem = document.createElement('div');
        cartItem.className = 'cart-item';
        cartItem.innerHTML = `
            <img src="${item.product.image}" alt="${item.product.name}" class="cart-item-image">
            <div class="cart-item-details">
                <div class="cart-item-name">${item.product.name}</div>
                <div class="cart-item-price">$${item.product.price.toFixed(2)}</div>
                <div class="cart-item-quantity">
                    <button class="decrease-qty" data-index="${index}">-</button>
                    <input type="number" value="${item.quantity}" min="1" data-index="${index}">
                    <button class="increase-qty" data-index="${index}">+</button>
                    <span class="cart-item-total">$${(item.product.price * item.quantity).toFixed(2)}</span>
                </div>
            </div>
            <button class="remove-item" data-index="${index}"><i class="fas fa-trash"></i></button>
        `;
        
        cartItemsContainer.appendChild(cartItem);
        
        // Add event listeners
        const decreaseBtn = cartItem.querySelector('.decrease-qty');
        const increaseBtn = cartItem.querySelector('.increase-qty');
        const quantityInput = cartItem.querySelector('input');
        const removeBtn = cartItem.querySelector('.remove-item');
        
        decreaseBtn.addEventListener('click', () => {
            if (item.quantity > 1) {
                item.quantity--;
                updateCartItem(index);
            }
        });
        
        increaseBtn.addEventListener('click', () => {
            item.quantity++;
            updateCartItem(index);
        });
        
        quantityInput.addEventListener('change', (e) => {
            const newQuantity = parseInt(e.target.value);
            if (newQuantity > 0) {
                item.quantity = newQuantity;
                updateCartItem(index);
            }
        });
        
        removeBtn.addEventListener('click', () => {
            removeFromCart(index);
        });
    });
    
    updateCartUI();
}

// Update cart item
function updateCartItem(index) {
    renderCartItems();
}

// Remove item from cart
function removeFromCart(index) {
    cart.splice(index, 1);
    renderCartItems();
    updateCartUI();
}

// Render checkout items
function renderCheckoutItems() {
    checkoutItemsContainer.innerHTML = '';
    
    cart.forEach(item => {
        const checkoutItem = document.createElement('div');
        checkoutItem.className = 'checkout-item';
        checkoutItem.innerHTML = `
            <span>${item.product.name} x ${item.quantity}</span>
            <span>$${(item.product.price * item.quantity).toFixed(2)}</span>
        `;
        
        checkoutItemsContainer.appendChild(checkoutItem);
    });
    
    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    checkoutTotalElement.textContent = `$${total.toFixed(2)}`;
}

// Handle user login
async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        const response = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ email, password })
        });
        
        if (!response.ok) throw new Error('Login failed');
        
        const data = await response.json();
        currentUser = data.user;
        authToken = data.token; // Store token separately
        
        // Store token and user in localStorage
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update UI to show logged in state
        loginBtn.innerHTML = '<i class="fas fa-user-check"></i>';
        
        // Close modal
        authModal.style.display = 'none';
        
        // Show notification
        showNotification('Login successful!');
    } catch (error) {
        console.error('Login error:', error);
        showNotification('Login failed. Please check your credentials.', 'error');
    }
}

// Handle user registration
async function handleRegister(event) {
    event.preventDefault();
    
    const name = document.getElementById('register-name').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    const confirmPassword = document.getElementById('register-confirm-password').value;
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match!', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ name, email, password })
        });
        
        if (!response.ok) throw new Error('Registration failed');
        
        const data = await response.json();
        currentUser = data.user;
        authToken = data.token; // Store token separately
        
        // Store token and user in localStorage
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Update UI to show logged in state
        loginBtn.innerHTML = '<i class="fas fa-user-check"></i>';
        
        // Close modal
        authModal.style.display = 'none';
        
        // Show notification
        showNotification('Registration successful!');
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Registration failed. Please try again.', 'error');
    }
}

// Handle placing an order
async function handlePlaceOrder(event) {
    event.preventDefault();
    
    // Check if user is logged in
    if (!authToken) {
        showNotification('Please login to place an order.', 'error');
        authModal.style.display = 'block';
        checkoutModal.style.display = 'none';
        return;
    }
    
    const name = document.getElementById('checkout-name').value;
    const address = document.getElementById('checkout-address').value;
    const city = document.getElementById('checkout-city').value;
    const zip = document.getElementById('checkout-zip').value;
    
    if (!name || !address || !city || !zip) {
        showNotification('Please fill in all shipping information.', 'error');
        return;
    }
    
    const orderItems = cart.map(item => ({
        product: item.product._id,
        quantity: item.quantity,
        price: item.product.price
    }));
    
    const total = cart.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
    
    try {
        const response = await fetch(`${API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}` // Use the stored token
            },
            body: JSON.stringify({
                items: orderItems,
                shippingAddress: { name, address, city, zip },
                total
            })
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to place order');
        }
        
        const order = await response.json();
        
        // Clear cart
        cart = [];
        updateCartUI();
        
        // Close checkout modal
        checkoutModal.style.display = 'none';
        
        // Show confirmation modal
        orderIdElement.textContent = order._id;
        confirmationModal.style.display = 'block';
        
        // Show notification
        showNotification('Order placed successfully!');
    } catch (error) {
        console.error('Order error:', error);
        showNotification(`Failed to place order: ${error.message}`, 'error');
    }
}

// Show notification
function showNotification(message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to DOM
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Hide and remove notification
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Add notification styles to head
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        transform: translateY(100px);
        opacity: 0;
        transition: transform 0.3s, opacity 0.3s;
    }
    
    .notification.show {
        transform: translateY(0);
        opacity: 1;
    }
    
    .notification.success {
        background-color: #4caf50;
    }
    
    .notification.error {
        background-color: #e63946;
    }
    
    .notification.info {
        background-color: #2196F3;
    }
`;
document.head.appendChild(notificationStyles);
