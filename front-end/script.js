const apiURL = 'http://localhost:8081';

// Automatically intercept fetch to inject JWT Bearer token
const originalFetch = window.fetch;
window.fetch = function (url, options = {}) {
    options.headers = options.headers || {};
    const token = localStorage.getItem("accessToken");
    if (token) {
        if (options.headers instanceof Headers) {
            options.headers.set("Authorization", `Bearer ${token}`);
        } else {
            options.headers["Authorization"] = `Bearer ${token}`;
        }
    }
    return originalFetch(url, options).then(response => {
        if (response.status === 401 && !url.includes('/auth/login')) {
            localStorage.removeItem("accessToken");
            localStorage.removeItem("refreshToken");
            const overlay = document.getElementById('loginOverlay');
            if (overlay) {
                overlay.style.display = 'flex';
            }
        }
        return response;
    });
};

let productPage = 0;
let productSize = 5;
let inventoryPage = 0;
let inventorySize = 5;
let students = [];
let Ordercount = 1;
let deleteRow = [];

function resetForm() {
    const inputs = document.querySelectorAll("#myform input:not([type='submit']), #myform select");
    inputs.forEach(input => {
        input.value = "";
    })
}

document.addEventListener('DOMContentLoaded', function () {
    const navLinks = document.querySelectorAll('.nav-item .nav-link');

    const activeLink = document.querySelector('.nav-item .nav-link.active');

    if (activeLink) {

        let html = `<h1 style='color: white;'>${activeLink.textContent}</h1>`
        head.innerHTML = html;

    }

    navLinks.forEach(link => {
        link.addEventListener('click', function (event) {
            let html = `<h1 style='color: white;'>${event.target.textContent}</h1>`
            head.innerHTML = html;
        });
    });
});


function createMoreOrderField() {
    Ordercount++;
    OrderList = document.getElementById('OrderListBody');

    tr = document.createElement('tr');
    tr.setAttribute('id', `${Ordercount}`)



    tr.innerHTML =
        `
            <td><input type="text" class="input-cell SerialNo" disabled>
            </td>
            <td><input type="text" class="input-cell" id="orderProductName${Ordercount}"
                placeholder="Enter Product Name" onkeyup="fillProductId(${Ordercount})"
                required>
            <div id="OrderSuggestion${Ordercount}">

            </div>
            </td>

            <td><input type="text" class="input-cell" id="orderProductId${Ordercount}"
                                                    placeholder="Enter ProductId" disabled required></td>
            <td><input type="text" class="input-cell" id="orderProductPrice${Ordercount}"
                                                    placeholder=" Enter Product price" disabled required></td>
            <td><input type="text" class="input-cell" id="orderProductQuantity${Ordercount}"
                                                    placeholder="Enter Quantity" required
                                                    onkeyup="calculatePrice(${Ordercount}),validateQuantity(${Ordercount})"></td>
             <td><input type="text" class="input-cell" id="orderTotal${Ordercount}"
                                                    placeholder="Enter Total Here" disabled required></td>
            <td><button type="button" class="remove-btn" onclick="deleteDiv(${Ordercount})">Remove</button></td>
        `


    OrderList.appendChild(tr);
    setSerialNo();

}

function deleteDiv(count) {

    let divToDelete = document.getElementById(`${count}`);

    // Check if the div exists
    if (divToDelete && Ordercount != 1) {
        divToDelete.remove();
        deleteRow.push(count);
    }
    else {
        alert(`Atleast One row is required`);
    }


    setSerialNo()
    calculateTotal()

}

function calculateTotal() {
    let total = 0;
    for (let i = 1; i <= Ordercount; i++) {
        totalField = document.getElementById(`orderTotal${i}`);
        if (totalField) {
            if (totalField.value)
                total = total + parseInt(totalField.value)
        }

    }

    document.getElementById('totalOrderValue').value = total;
}


function setSerialNo() {
    const serialNos = document.querySelectorAll('.SerialNo');
    let count = 1;
    serialNos.forEach(serialNo => {
        serialNo.value = count++;

    });

}


function fillProductId(count) {
    let storeId = document.getElementById('orderStoreId').value;
    suggestion = document.getElementById(`OrderSuggestion${count}`);
    productId = document.getElementById(`orderProductName${count}`).value
    if (productId.trim() !== '') {
        let url = `${apiURL}/inventory/search/${productId}/${storeId}`;
        fetch(url, {
            method: "GET",
            headers: { "content-type": "application/json" },
        })
            .then(response => {
                return response.json();
            })
            .then(data => {
    
               showOrderSuggestion(data.product, count);
            })
            .catch(error => {
                alert(error);
            })
    }
    else {
        suggestion.innerHTML = "";
    }


}





function showOrderSuggestion(products, count) {


    suggestion = document.getElementById(`OrderSuggestion${count}`);
    productName = document.getElementById(`orderProductName${count}`);
    productId = document.getElementById(`orderProductId${count}`);
    productPrice = document.getElementById(`orderProductPrice${count}`);
    quantity = document.getElementById(`orderProductQuantity${count}`);
    suggestion.innerHTML = "";
    for (product of products) {
        div = document.createElement('div');
        div.classList.add('suggestionCard');
        h6 = document.createElement('h6');
        h6.textContent = product.name
        div.appendChild(h6);
        div.addEventListener('click', (function (product) {
            return function () {
                quantity.value = '1';
                productName.value = product.name;
                productId.value = product.id;
                productPrice.value = product.price;
                suggestion.innerHTML = "";
                calculatePrice(count);

            };
        })(product));
        suggestion.appendChild(div);
    }
}



function calculatePrice(count) {

    price = document.getElementById(`orderProductPrice${count}`).value;
    quantity = document.getElementById(`orderProductQuantity${count}`).value;
    total = document.getElementById(`orderTotal${count}`);
    total.value = (price * quantity);
    calculateTotal();
}

function validateStoreId(event) {
    event.preventDefault();

    let now = new Date();
    let year = now.getFullYear();
    let month = String(now.getMonth() + 1).padStart(2, '0');
    let day = String(now.getDate()).padStart(2, '0');
    let hours = String(now.getHours()).padStart(2, '0');
    let minutes = String(now.getMinutes()).padStart(2, '0');
    let formattedDateTime = `${year}-${month}-${day}T${hours}:${minutes}`;
    let dateTimeInput = document.getElementById("datetime");
    dateTimeInput.value = formattedDateTime;


    let submitButton = document.getElementById('submitButton');
    let storeId = document.getElementById('orderStoreId');
    let url = `${apiURL}/store/validate/${storeId.value}`
    fetch(url, {
        method: "GET",
        headers: { "content-type": "application/json" },
    })
        .then(response => {
            return response.json();
        })
        .then(data => {
            if (data === true) {
                storeId.disabled = true;
                document.getElementById('displayForm').style = 'display:block';
                submitButton.style = 'display:flex';

            }
            else {
                alert("Enter correct Store id")
            }
        })
}


function addStore(event) {
    event.preventDefault();
    let storeName = document.getElementById('storeName').value;
    let storeAddress1 = document.getElementById('storeAddress1').value;
    let storeAddress2 = document.getElementById('storeAddress2').value;
    let storeAddress3 = document.getElementById('storeAddress3').value;
    let storeAddress = storeAddress1 + " " + storeAddress2 + " " + storeAddress3;

    let data = { name: storeName, address: storeAddress };

    let url = `${apiURL}/store`
    fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data)
    })
        .then(response => {
            return response.json();
        })
        .then(data => {
            alert(data.message);
            resetForm();
        })
}


function viewProduct(event) {
    if (event) {
        event.preventDefault();
        inventoryPage = 0;
    }

    let inputstoreId = document.getElementById('vstoreId');
    document.getElementById('searchBar').disabled = false
    document.getElementById('SearchButton').disabled = false;
    document.getElementById('vstoreId').disabled = false
    document.getElementById('category').disabled = false;
    storeId = inputstoreId.value;
    inputstoreId.disabled = true;

    const tableBody = document.getElementById('tableBody');
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Loading products and inventory...</td></tr>';
    }

    let url = `${apiURL}/inventory/${storeId}?page=${inventoryPage}&size=${inventorySize}&sort=id,asc`;
    fetch(url, {
        method: "GET",
        headers: { "content-type": "application/json" },
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server returned status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.products && data.products.length > 0) {
                createData(data.products, storeId);
                renderInventoryPagination(data.totalPages, storeId);
            } else {
                if (tableBody) {
                    tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">No products found in this store\'s inventory.</td></tr>';
                }
                renderInventoryPagination(0, storeId);
            }
        })
        .catch(error => {
            console.error('Error loading inventory:', error);
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:red; font-weight:bold;">Error loading inventory: ${error.message}</td></tr>`;
            }
        });
}



function filter() {

    productName = document.getElementById('searchBar').value

    category = document.getElementById('category').value;


    if (category.trim() == 'Allcategory' && productName.trim().length == 0) {
        viewProduct(event);
        return;
    }

    else if (productName.trim().length == 0) {
        productName = null;
    }
    else if (category.trim() == 'Allcategory') {
        category = null;
    }

    let storeId = document.getElementById('vstoreId').value;
    const tableBody = document.getElementById('tableBody');
    if (tableBody) {
        tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">Filtering products...</td></tr>';
    }


    let url = `${apiURL}/inventory/filter/${category}/${productName}/${storeId}`;
    fetch(url, {
        method: "GET",
        headers: { "content-type": "application/json" },
    })
        .then(response => {
            if (!response.ok) {
                throw new Error(`Server returned status: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (data.product && data.product.length > 0) {
                createData(data.product, storeId);
            } else {
                if (tableBody) {
                    tableBody.innerHTML = '<tr><td colspan="9" style="text-align:center;">No matching products found.</td></tr>';
                }
            }
        })
        .catch(error => {
            console.error('Error filtering inventory:', error);
            if (tableBody) {
                tableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:red; font-weight:bold;">Error filtering products: ${error.message}</td></tr>`;
            }
        });
}





async function createData(products, storeId) {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '';
    products.forEach(product => {

        const row = document.createElement('tr');

        const imageTd = document.createElement('td');
        if (product.images && product.images.length > 0) {
            const img = document.createElement('img');
            img.src = product.images[0].imageUrl;
            img.style.maxHeight = '40px';
            img.style.borderRadius = '4px';
            imageTd.appendChild(img);
        } else {
            imageTd.textContent = 'No Image';
        }

        const prodId = document.createElement('td');
        prodId.classList.add('expandable');
        prodId.textContent = product.id;

        const name = document.createElement('td');
        name.classList.add('expandable');
        name.textContent = product.name;

        const category = document.createElement('td');
        category.classList.add('expandable');
        category.textContent = product.category ? product.category.name : '';

        const supplier = document.createElement('td');
        supplier.classList.add('expandable');
        supplier.textContent = product.supplier ? product.supplier.name : '';

        const price = document.createElement('td');
        price.classList.add('expandable');
        price.textContent = product.price;

        const sku = document.createElement('td');
        sku.classList.add('expandable');
        sku.textContent = product.sku;

        const stockLevel = document.createElement('td');
        stockLevel.classList.add('expandable');
        stockLevel.textContent = product.inventory && product.inventory[0] ? product.inventory[0].stockLevel : 0;

        const reviewCol = document.createElement('td');
        const reviewBtn = document.createElement('button');
        reviewBtn.classList.add('btn', 'btn-info');
        reviewBtn.textContent = 'Reviews';
        reviewBtn.addEventListener('click', () => {
            window.location = `reviews.html?productId=${product.id}&storeId=${storeId}&productName=${product.name}`;
        })
        reviewCol.appendChild(reviewBtn);

        const buttoncolumn = document.createElement('td');
        const button = document.createElement('button')
        button.classList.add('btn', 'btn-warning');
        button.textContent = 'Edit';
        button.addEventListener('click', () => {
            const level = product.inventory && product.inventory[0] ? product.inventory[0].stockLevel : 0;
            window.location = `edit-product.html?productId=${product.id}&storeId=${storeId}&stockLevel=${level}`;
        });
        buttoncolumn.appendChild(button);

        const buttonTable2 = document.createElement('td');
        const delbutton = document.createElement('button')
        delbutton.classList.add('btn', 'btn-danger');
        delbutton.textContent = 'Delete';
        delbutton.value = product.id;
        delbutton.addEventListener('click', function () {
            showModal(this.value, product.name, 2);
        });
        buttonTable2.appendChild(delbutton);

        row.appendChild(imageTd);
        row.appendChild(prodId);
        row.appendChild(name);
        row.appendChild(category);
        row.appendChild(supplier);
        row.appendChild(price);
        row.appendChild(sku);
        row.appendChild(stockLevel);
        row.appendChild(reviewCol);
        row.appendChild(buttoncolumn);
        row.appendChild(buttonTable2);

        tableBody.appendChild(row);
    });
}





function viewProductByid(productId) {

    let url = `${apiURL}/product/${productId}`;
    fetch(url, {
        method: "GET",
        headers: { "content-type": "application/json" },
    })
        .then(response => {
            return response.json();
        })
        .then(data => {
            console.log(data);
            if (data.products) {
                fillDetails(data.products, productId);
            }
            else {
                alert("No data with product id: " + productId);
                resetForm();
                return;
            }
        })
        .catch(error => {
            alert(error);
        })
}


function fillDetails(products, productId) {
    let productIdDiv = document.getElementById('uproductId');
    let productName = document.getElementById('uproductName');
    let category = document.getElementById('ucategory');
    let productPrice = document.getElementById('uproductPrice');
    let SKU = document.getElementById('uSKU');

    productIdDiv.value = productId;
    productName.value = products.name;
    category.value = products.category;
    productPrice.value = products.price;
    SKU.value = products.sku;

}



function updateProduct(event) {
    event.preventDefault();
    let productId = document.getElementById('uproductId').value;
    let productName = document.getElementById('uproductName').value;
    let category = document.getElementById('ucategory').value;
    let productPrice = document.getElementById('uproductPrice').value;
    let SKU = document.getElementById('uSKU').value;
    let stockLevel = document.getElementById('ustockLevel').value;
    let storeId = document.getElementById('ustoreId').value;

    let ProductModel = { id: productId, name: productName, category: category, price: productPrice, sku: SKU };
    let InventoryModel = { product: { id: productId }, store: { id: storeId }, stockLevel: stockLevel };
    let data = { product: ProductModel, inventory: InventoryModel };

    console.log(data);
    let url = `${apiURL}/inventory`;
    fetch(url, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data)
    })
        .then(response => {
            return response.json();
        })
        .then(data => {
            alert(data.message);
            location.href = `index.html?id=navBar3&storeid=${storeId}`;
        })
}



function fillProductName() {
    let productName = document.getElementById('productName').value;
    if (productName.trim() != "") {
        let url = `${apiURL}/product/searchProduct/${productName}`;
        fetch(url, {
            method: "GET",
            headers: { "content-type": "application/json" },
        })
            .then(response => {
                return response.json();
            })
            .then(data => {
               showproductSuggestion(data.products);
            })
            .catch(error => {
                alert(error);
            })
    }
    else {
        suggestion = document.getElementById('aStoreSuggestion');
        suggestion.innerHTML = "";

    }
}


function showproductSuggestion(products) {

    suggestion = document.getElementById('aStoreSuggestion');
    productName = document.getElementById('productName')
    productId = document.getElementById('productId')
    category = document.getElementById('category');
    productPrice = document.getElementById('productPrice');
    SKU = document.getElementById('SKU');

    suggestion.innerHTML = "";
    for (product of products) {
        button = document.createElement('button');
        button.type = 'button'
        button.value = product.id;
        button.innerHTML = product.name;
        button.addEventListener('click', (function (product) {
            return function () {
                productName.value = product.name;
                suggestion.innerHTML = "";
                productId.value = product.id;
                category.value = product.category;
                productPrice.value = product.price;
                SKU.value = product.sku;
            };
        })(product));



        suggestion.appendChild(button);
    }
}



function addProductToInventory(event) {
    event.preventDefault();

    productId = document.getElementById('productId').value;
    storeId = document.getElementById('astoreId').value;
    stockLevel = document.getElementById('astockLevel').value;

    let data = { product: { id: productId }, store: { id: storeId }, stockLevel: stockLevel };
    let url = `${apiURL}/inventory`
    fetch(url, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(data)
    })
        .then(response => {
            return response.json();
        })
        .then(data => {
            alert(data.message);
            location.href = `index.html?id=navBar3&storeid=${storeId}`;
        })
}



function viewProductList() {
    filterParentProduct();
}

function showProductsInTable(products) {
    const allProducts = document.getElementById('allProducts');
    if (!allProducts) return;
    allProducts.innerHTML = "";
    products.forEach(product => {

        const row = document.createElement('tr');

        const imageTd = document.createElement('td');
        if (product.images && product.images.length > 0) {
            const img = document.createElement('img');
            img.src = product.images[0].imageUrl;
            img.style.maxHeight = '40px';
            img.style.borderRadius = '4px';
            imageTd.appendChild(img);
        } else {
            imageTd.textContent = 'No Image';
        }

        const prodId = document.createElement('td');
        prodId.classList.add('expandable');
        prodId.textContent = product.id;

        const name = document.createElement('td');
        name.classList.add('expandable');
        name.textContent = product.name;

        const category = document.createElement('td');
        category.classList.add('expandable');
        category.textContent = product.category ? product.category.name : '';

        const supplier = document.createElement('td');
        supplier.classList.add('expandable');
        supplier.textContent = product.supplier ? product.supplier.name : '';

        const price = document.createElement('td');
        price.classList.add('expandable');
        price.textContent = product.price;

        const sku = document.createElement('td');
        sku.classList.add('expandable');
        sku.textContent = product.sku;

        const buttonTable = document.createElement('td');
        const button = document.createElement('button')
        button.classList.add('btn', 'btn-warning');
        button.value = product.id;
        button.textContent = 'Edit';
        button.addEventListener('click', function () {
            window.location = `edit-parent-product.html?productId=${this.value}`
        });
        buttonTable.appendChild(button);

        const buttonTable2 = document.createElement('td');
        const delbutton = document.createElement('button')
        delbutton.classList.add('btn', 'btn-danger');
        delbutton.textContent = 'Delete';
        delbutton.value = product.id;
        delbutton.addEventListener('click', function () {
            showModal(this.value, product.name, 1);
        });
        buttonTable2.appendChild(delbutton);

        row.appendChild(imageTd);
        row.appendChild(prodId);
        row.appendChild(name);
        row.appendChild(category);
        row.appendChild(supplier);
        row.appendChild(price);
        row.appendChild(sku);
        row.appendChild(buttonTable);
        row.appendChild(buttonTable2);

        allProducts.appendChild(row);
    });
}



function showModal(id, name, action) {
    console.log(action);
    const myModal = new bootstrap.Modal(document.getElementById('myModal'));
    const modalFooter = document.getElementById('modal-footer');
    text = document.getElementById('deleteProuctName');
    text.innerHTML = name;
    modalFooter.innerHTML = "";
    button = document.createElement('button');
    button.classList.add('btn', 'btn-danger')
    button.textContent = 'Yes';
    if (action == 1) {
        button.addEventListener('click', function () {
            deleteItembyId(id);
            myModal.hide();
        })
    }
    else {
        button.addEventListener('click', function () {
            removeFromInventory(id)
            myModal.hide();
        })
    }
    modalFooter.appendChild(button);
    myModal.show();
}


function deleteItembyId(id) {
 


    let url = `${apiURL}/product/${id}`;
    fetch(url, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
    })
        .then(response => {
            return response.json();
        })
        .then(data => {
            alert(data.message);
            location.href = "index.html?id=navBar2";
        })
        .catch(error => {
            alert(error);
        })


}

function removeFromInventory(id) {
    let url = `${apiURL}/inventory/${id}`
    fetch(url, {
        method: "DELETE",
        headers: { "content-type": "application/json" },
    })
        .then(response => {
            return response.json();
        })
        .then(data => {
            alert(data.message);
            viewProduct(event);
            location.href = `index.html?id=navBar3&storeid=${storeId}`;

        })
        .catch(error => {
            alert(error);
        })
}



async function filterParentProduct() {
    let skuOrName = document.getElementById('ProductsearchBar').value.trim();
    let categorySelect = document.getElementById('pcategory').value;
    let minPrice = document.getElementById('filterMinPrice') ? document.getElementById('filterMinPrice').value : '';
    let maxPrice = document.getElementById('filterMaxPrice') ? document.getElementById('filterMaxPrice').value : '';
    let storeId = document.getElementById('filterStoreId') ? document.getElementById('filterStoreId').value : '';
    let minRating = document.getElementById('filterMinRating') ? document.getElementById('filterMinRating').value : '';

    let params = new URLSearchParams();
    if (skuOrName) {
        params.append('sku', skuOrName);
    }
    if (categorySelect && categorySelect !== 'Allcategory') {
        params.append('categoryId', categorySelect);
    }
    if (minPrice) {
        params.append('minPrice', minPrice);
    }
    if (maxPrice) {
        params.append('maxPrice', maxPrice);
    }
    if (storeId) {
        params.append('storeId', storeId);
    }
    if (minRating) {
        params.append('minRating', minRating);
    }
    params.append('page', productPage);
    params.append('size', productSize);
    params.append('sort', 'id,asc');

    let url = `${apiURL}/product/search?${params.toString()}`;
    const allProducts = document.getElementById('allProducts');
    if (allProducts) {
        allProducts.innerHTML = '<tr><td colspan="9" style="text-align:center;">Searching parent products...</td></tr>';
    }

    const token = localStorage.getItem('accessToken');
    const headers = { "content-type": "application/json" };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    fetch(url, {
        method: "GET",
        headers: headers,
    })
        .then(response => {
            if (!response.ok) throw new Error(`Status: ${response.status}`);
            return response.json();
        })
        .then(data => {
            if (data.products && data.products.length > 0) {
                showProductsInTable(data.products);
                renderProductPagination(data.totalPages);
            } else {
                if (allProducts) {
                    allProducts.innerHTML = '<tr><td colspan="9" style="text-align:center;">No matching products found.</td></tr>';
                }
                renderProductPagination(0);
            }
        })
        .catch(error => {
            console.error(error);
            if (allProducts) {
                allProducts.innerHTML = `<tr><td colspan="9" style="text-align:center; color:red;">Error loading products: ${error.message}</td></tr>`;
            }
        });
}



function getProductByid(productId) {

    let url = `${apiURL}/product/${productId}`;
    fetch(url, {
        method: "GET",
        headers: { "content-type": "application/json" },
    })
        .then(response => {
            return response.json();
        })
        .then(data => {
            if (data.products) {
                setParentProduct(data.products);
            }
            else {
                alert("No data with product id: " + productId);
                resetForm();
                return;
            }
        })
        .catch(error => {
            alert(error);
        })
}

function setParentProduct(product) {
    document.getElementById('pproductName').value = product.name;
    if (product.category && document.getElementById('pcategory')) {
        document.getElementById('pcategory').value = product.category.id;
    }
    if (product.supplier && document.getElementById('psupplier')) {
        document.getElementById('psupplier').value = product.supplier.id;
    }
    document.getElementById('pproductPrice').value = product.price;
    document.getElementById('pSKU').value = product.sku;

    if (product.images && product.images.length > 0) {
        const imageUrl = product.images[0].imageUrl;
        if (document.getElementById('parentImageUrl')) {
            document.getElementById('parentImageUrl').value = imageUrl;
        }
        const imgPreview = document.getElementById('imagePreview');
        if (imgPreview) {
            imgPreview.src = imageUrl;
            imgPreview.style.display = 'block';
        }
    }
}



function updateParentProduct(event) {
    event.preventDefault();

    let productId = document.getElementById('pproductId').value;
    let productName = document.getElementById('pproductName').value;
    let categoryId = document.getElementById('pcategory').value;
    let supplierId = document.getElementById('psupplier').value;
    let price = document.getElementById('pproductPrice').value;
    let sku = document.getElementById('pSKU').value;
    let imageUrl = document.getElementById('parentImageUrl') ? document.getElementById('parentImageUrl').value : '';

    let imagesList = imageUrl ? [{ imageUrl: imageUrl }] : [];

    let data = {
        id: parseInt(productId),
        name: productName,
        category: { id: parseInt(categoryId) },
        supplier: supplierId ? { id: parseInt(supplierId) } : null,
        price: parseFloat(price),
        sku: sku,
        images: imagesList
    };

    let url = `${apiURL}/product`
    fetch(url, {
        method: "PUT",
        headers: {
            "content-type": "application/json",
            "Authorization": localStorage.getItem('accessToken') ? `Bearer ${localStorage.getItem('accessToken')}` : ""
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            return response.json();
        })
        .then(data => {
            alert(data.message);
            location.href = "index.html?id=navBar2";
        })
}



function addParentProduct(event) {
    event.preventDefault();
    let productName = document.getElementById('parentproductName').value;
    let categoryId = document.getElementById('parentcategory').value;
    let supplierId = document.getElementById('parentsupplier').value;
    let productPrice = document.getElementById('parentproductPrice').value;
    let SKU = document.getElementById('parentSKU').value;
    let imageUrl = document.getElementById('parentImageUrl') ? document.getElementById('parentImageUrl').value : '';

    let imagesList = imageUrl ? [{ imageUrl: imageUrl }] : [];

    let data = {
        name: productName,
        category: { id: parseInt(categoryId) },
        supplier: supplierId ? { id: parseInt(supplierId) } : null,
        price: parseFloat(productPrice),
        sku: SKU,
        images: imagesList
    };

    let url = `${apiURL}/product`
    fetch(url, {
        method: "POST",
        headers: {
            "content-type": "application/json",
            "Authorization": localStorage.getItem('accessToken') ? `Bearer ${localStorage.getItem('accessToken')}` : ""
        },
        body: JSON.stringify(data)
    })
        .then(response => {
            return response.json();
        })
        .then(data => {
            alert(data.message);
            location.href = "index.html?id=navBar2";
        })
}




function validateQuantity(OrderNo) {
    quantity = document.getElementById(`orderProductQuantity${OrderNo}`).value;
    storeId = document.getElementById('orderStoreId').value;
    productId = document.getElementById(`orderProductId${OrderNo}`).value;
    if (!quantity || !productId || !storeId) {
        return;
    }
    let url = `${apiURL}/inventory/validate/${quantity}/${storeId}/${productId}`
    fetch(url, {
        method: "GET",
        headers: { "content-type": "application/json" }
    })
        .then(response => {
            return response.json();
        })
        .then(data => {
            if (!data) {
                alert("Limited Quantity Available, Reduce quantity")
            }
        })
        .catch(error => {
            alert(error);
        })
}

async function placeOrder(event) {
    event.preventDefault();


    let storeId = document.getElementById("orderStoreId").value;
    let customerName = document.getElementById("customerName").value;
    let customerEmail = document.getElementById("customerEmail").value;
    let customerPhone = document.getElementById("customerPhone").value;
    let datetime = document.getElementById("datetime").value;
    let totalOrderValue = document.getElementById('totalOrderValue').value;
    if (!totalOrderValue) {
        alert("Enter atleast one product");
        return
    }

    let purchaseProduct = [];
    for (let i = 1; i <= Ordercount; i++) {

        if (deleteRow.includes(i)) {
            continue;
        }
        console.log(`orderProductName${i}`);

        let orderProductName = document.getElementById(`orderProductName${i}`).value;
        let orderProductId = document.getElementById(`orderProductId${i}`).value;
        let orderProductPrice = document.getElementById(`orderProductPrice${i}`).value;
        let orderProductQuantity = document.getElementById(`orderProductQuantity${i}`).value;
        let orderProductTotal = document.getElementById(`orderTotal${i}`).value;

        let data = {
            name: orderProductName,
            id: orderProductId,
            price: orderProductPrice,
            quantity: orderProductQuantity,
            total: orderProductTotal
        };
        purchaseProduct.push(data);
    }


    let orderData = {
        storeId: storeId,
        customerName: customerName,
        customerEmail: customerEmail,
        customerPhone: customerPhone,
        datetime: datetime,
        purchaseProduct: purchaseProduct,
        totalPrice: totalOrderValue
    };


    try {
        const response = await fetch(`${apiURL}/store/placeOrder`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(orderData)
        }).then(response => {
            return response.json();
        }).then(data => {
            if (data.message) {
                alert(data.message);
                location.href = "index.html?id=navBar4";
            }
            else {
                alert(data.error);
            }
        })

    } catch (error) {
        alert('Error placing order:', error);
    }
}

function renderProductPagination(totalPages) {
    const controls = document.getElementById('paginationControls');
    if (!controls) return;
    controls.innerHTML = '';
    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = productPage === 0;
    prevBtn.style.marginRight = '10px';
    prevBtn.style.padding = '5px 10px';
    prevBtn.onclick = () => {
        if (productPage > 0) {
            productPage--;
            viewProductList();
        }
    };

    const info = document.createElement('span');
    info.textContent = ` Page ${productPage + 1} of ${totalPages} `;
    info.style.color = 'white';
    info.style.fontWeight = 'bold';

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = productPage >= totalPages - 1;
    nextBtn.style.marginLeft = '10px';
    nextBtn.style.padding = '5px 10px';
    nextBtn.onclick = () => {
        if (productPage < totalPages - 1) {
            productPage++;
            viewProductList();
        }
    };

    controls.appendChild(prevBtn);
    controls.appendChild(info);
    controls.appendChild(nextBtn);
}

function renderInventoryPagination(totalPages, storeId) {
    const controls = document.getElementById('inventoryPaginationControls');
    if (!controls) return;
    controls.innerHTML = '';
    if (totalPages <= 1) return;

    const prevBtn = document.createElement('button');
    prevBtn.textContent = 'Previous';
    prevBtn.disabled = inventoryPage === 0;
    prevBtn.style.marginRight = '10px';
    prevBtn.style.padding = '5px 10px';
    prevBtn.onclick = () => {
        if (inventoryPage > 0) {
            inventoryPage--;
            viewProduct(null);
        }
    };

    const info = document.createElement('span');
    info.textContent = ` Page ${inventoryPage + 1} of ${totalPages} `;
    info.style.color = 'white';
    info.style.fontWeight = 'bold';

    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next';
    nextBtn.disabled = inventoryPage >= totalPages - 1;
    nextBtn.style.marginLeft = '10px';
    nextBtn.style.padding = '5px 10px';
    nextBtn.onclick = () => {
        if (inventoryPage < totalPages - 1) {
            inventoryPage++;
            viewProduct(null);
        }
    };

    controls.appendChild(prevBtn);
    controls.appendChild(info);
    controls.appendChild(nextBtn);
}

// Dynamics loading dropdown values
async function loadCategoriesAndSuppliers() {
    let headers = {};
    const token = localStorage.getItem('accessToken');
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const catRes = await fetch(`${apiURL}/category`, { headers });
        if (catRes.ok) {
            const categories = await catRes.json();
            const indexCatSelect = document.getElementById('pcategory');
            if (indexCatSelect) {
                indexCatSelect.innerHTML = '<option value="Allcategory" selected>All category</option>';
                categories.forEach(cat => {
                    const opt = document.createElement('option');
                    opt.value = cat.id;
                    opt.textContent = cat.name;
                    indexCatSelect.appendChild(opt);
                });
            }
            const indexInvCatSelect = document.getElementById('category');
            if (indexInvCatSelect) {
                indexInvCatSelect.innerHTML = '<option value="Allcategory" selected>All category</option>';
                categories.forEach(cat => {
                    const opt = document.createElement('option');
                    opt.value = cat.name;
                    opt.textContent = cat.name;
                    indexInvCatSelect.appendChild(opt);
                });
            }
            const addCatSelect = document.getElementById('parentcategory');
            if (addCatSelect) {
                addCatSelect.innerHTML = '<option value="" selected disabled>Select category</option>';
                categories.forEach(cat => {
                    const opt = document.createElement('option');
                    opt.value = cat.id;
                    opt.textContent = cat.name;
                    addCatSelect.appendChild(opt);
                });
            }
            const editCatSelect = document.getElementById('pcategory');
            if (editCatSelect && editCatSelect.id === 'pcategory') {
                editCatSelect.innerHTML = '<option value="" selected disabled>Select category</option>';
                categories.forEach(cat => {
                    const opt = document.createElement('option');
                    opt.value = cat.id;
                    opt.textContent = cat.name;
                    editCatSelect.appendChild(opt);
                });
            }
        }
    } catch (e) {
        console.error("Error loading categories:", e);
    }

    try {
        const supRes = await fetch(`${apiURL}/supplier`, { headers });
        if (supRes.ok) {
            const suppliers = await supRes.json();
            const addSupSelect = document.getElementById('parentsupplier');
            if (addSupSelect) {
                addSupSelect.innerHTML = '<option value="" selected disabled>Select supplier</option>';
                suppliers.forEach(sup => {
                    const opt = document.createElement('option');
                    opt.value = sup.id;
                    opt.textContent = sup.name;
                    addSupSelect.appendChild(opt);
                });
            }
            const editSupSelect = document.getElementById('psupplier');
            if (editSupSelect) {
                editSupSelect.innerHTML = '<option value="" selected disabled>Select supplier</option>';
                suppliers.forEach(sup => {
                    const opt = document.createElement('option');
                    opt.value = sup.id;
                    opt.textContent = sup.name;
                    editSupSelect.appendChild(opt);
                });
            }
        }
    } catch (e) {
        console.error("Error loading suppliers:", e);
    }
}

// Product Image file upload
async function uploadProductImage() {
    const fileInput = document.getElementById('productImage');
    if (!fileInput || fileInput.files.length === 0) return;

    const file = fileInput.files[0];
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('accessToken');
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${apiURL}/uploads`, {
            method: 'POST',
            headers: headers,
            body: formData
        });

        if (response.ok) {
            const result = await response.json();
            document.getElementById('parentImageUrl').value = result.url;
            const imgPreview = document.getElementById('imagePreview');
            imgPreview.src = result.url;
            imgPreview.style.display = 'block';
        } else {
            const err = await response.json();
            alert('Upload failed: ' + (err.message || response.statusText));
        }
    } catch (e) {
        alert('Error uploading image: ' + e.message);
    }
}

// Stock Transfer operations
async function initiateTransfer(event) {
    event.preventDefault();
    const productId = document.getElementById('transProductId').value;
    const fromStoreId = document.getElementById('transFromStoreId').value;
    const toStoreId = document.getElementById('transToStoreId').value;
    const quantity = document.getElementById('transQuantity').value;

    const token = localStorage.getItem('accessToken');
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${apiURL}/transfers/initiate?productId=${productId}&fromStoreId=${fromStoreId}&toStoreId=${toStoreId}&quantity=${quantity}`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: headers
        });

        if (response.ok) {
            alert('Stock transfer initiated successfully!');
            document.getElementById('transferForm').reset();
            loadStockTransfers();
        } else {
            const err = await response.json();
            alert('Error initiating transfer: ' + (err.message || response.statusText));
        }
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function loadStockTransfers() {
    const logsBody = document.getElementById('transferLogs');
    if (!logsBody) return;

    logsBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Loading transfer logs...</td></tr>';

    const token = localStorage.getItem('accessToken');
    const headers = { "content-type": "application/json" };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${apiURL}/transfers`, { headers });
        if (response.ok) {
            const logs = await response.json();
            logsBody.innerHTML = '';

            if (logs.length === 0) {
                logsBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">No stock transfers found.</td></tr>';
                return;
            }

            logs.forEach(log => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${log.id}</td>
                    <td>${log.productId}</td>
                    <td>${log.fromStoreId}</td>
                    <td>${log.toStoreId}</td>
                    <td>${log.quantity}</td>
                    <td><span class="badge ${log.status === 'PENDING' ? 'bg-warning' : log.status === 'COMPLETED' ? 'bg-success' : 'bg-danger'}">${log.status}</span></td>
                    <td>${new Date(log.requestedAt).toLocaleString()}</td>
                    <td>
                        ${log.status === 'PENDING' ? `
                            <button class="btn btn-sm btn-success" onclick="confirmTransfer(${log.id})">Confirm</button>
                            <button class="btn btn-sm btn-danger" onclick="cancelTransfer(${log.id})">Cancel</button>
                        ` : '-'}
                    </td>
                `;
                logsBody.appendChild(tr);
            });
        } else {
            logsBody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:red;">Failed to load logs.</td></tr>';
        }
    } catch (e) {
        logsBody.innerHTML = '<tr><td colspan="8" style="text-align:center; color:red;">Error: ' + e.message + '</td></tr>';
    }
}

async function confirmTransfer(id) {
    if (!confirm('Are you sure you want to confirm this transfer?')) return;
    const token = localStorage.getItem('accessToken');
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${apiURL}/transfers/${id}/confirm`, {
            method: 'POST',
            headers: headers
        });

        if (response.ok) {
            alert('Transfer confirmed successfully!');
            loadStockTransfers();
        } else {
            const err = await response.json();
            alert('Confirmation failed: ' + (err.message || response.statusText));
        }
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function cancelTransfer(id) {
    if (!confirm('Are you sure you want to cancel this transfer?')) return;
    const token = localStorage.getItem('accessToken');
    const headers = {};
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(`${apiURL}/transfers/${id}/cancel`, {
            method: 'POST',
            headers: headers
        });

        if (response.ok) {
            alert('Transfer cancelled successfully!');
            loadStockTransfers();
        } else {
            const err = await response.json();
            alert('Cancellation failed: ' + (err.message || response.statusText));
        }
    } catch (e) {
        alert('Error: ' + e.message);
    }
}

async function handleOverlayLogin(event) {
    event.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;

    try {
        const res = await fetch(`${apiURL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        if (res.ok) {
            const data = await res.json();
            localStorage.setItem('accessToken', data.accessToken);
            localStorage.setItem('refreshToken', data.refreshToken);
            localStorage.setItem('userRole', data.role);
            document.getElementById('loginOverlay').style.display = 'none';
            await loadCategoriesAndSuppliers();
            viewProductList();
        } else {
            alert('Invalid credentials, please try again.');
        }
    } catch (e) {
        alert('Connection error: ' + e.message);
    }
}
