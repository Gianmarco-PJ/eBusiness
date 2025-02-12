const express = require("express");
const router = express.Router();
const pool = require("../database");
const { isLoggedIn } = require("../lib/auth");

//listar
router.get("/", isLoggedIn, (req, res) => {
  const user = req.user;

  res.render("index", {
    user,
    showAddProduct: user && user.role === "vendedor",
    showProductsClient: user && user.role === "cliente",
  });
});

//añadir un producto
router.get("/add", isLoggedIn, async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== "vendedor") {
      return res.redirect("/products/listClient");
    }

    const categories = await pool.query("SELECT id, name FROM categories");
    res.render("products/add", { categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).send("Error fetching categories");
  }
});

router.post("/add", isLoggedIn, async (req, res) => {
  const { name, description, price, stock, id_category, url_imagen } = req.body;
  const id_seller = req.user.id;

  const newProduct = {
    name,
    description,
    price,
    stock,
    id_category,
    id_seller,
    url_imagen,
  };

  try {
    await pool.query("INSERT INTO products SET ?", [newProduct]);
    res.redirect("/products/list");
  } catch (error) {
    console.error("Error saving product:", error);
    res.status(500).send("Error saving product");
  }
});

// Listar productos - vendedor
router.get("/list", isLoggedIn, async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== "vendedor") {
      return res.redirect("/products/listClient");
    }

    const products = await pool.query("SELECT * FROM products");
    res.render("products/list", { products });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Error fetching products");
  }
});

// Listar productos - cliente
router.get("/listClient", isLoggedIn, async (req, res) => {
  try {
    const user = req.user;
    if (user.role !== "cliente") {
      return res.redirect("/products/list");
    }

    const products = await pool.query("SELECT * FROM products");
    res.render("products/listClient", { products });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).send("Error fetching products");
  }
});

// Eliminar producto
router.get("/delete/:id", isLoggedIn, async (req, res) => {
  const { id } = req.params;
  try {
    const user = req.user;

    if (user.role !== "vendedor") {
      return res.redirect("/products/listClient");
    }

    await pool.query("DELETE FROM products WHERE id = ?", [id]);
    res.redirect("/products/list");
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).send("Error deleting product");
  }
});

// Editar producto
router.get("/edit/:id", isLoggedIn, async (req, res) => {
  const user = req.user;

  if (user.role !== "vendedor") {
    return res.redirect("/products/list");
  }

  try {
    const { id } = req.params;
    const products = await pool.query("SELECT * FROM products WHERE id = ?", [
      id,
    ]);
    const categories = await pool.query("SELECT id, name FROM categories");

    const product = products[0];
    const updatedCategories = categories.map((category) => ({
      ...category,
      isSelected: category.id === product.id_category,
    }));

    res.render("products/edit", { product, categories: updatedCategories });
  } catch (error) {
    console.error("Error fetching product or categories:", error);
    res.status(500).send("Error fetching product or categories");
  }
});

router.post("/edit/:id", isLoggedIn, async (req, res) => {
  const user = req.user;
  if (user.role !== "vendedor") {
    return res.redirect("/products/list");
  }

  const { id } = req.params;
  const { name, description, price, stock, id_category, url_imagen } = req.body;

  try {
    const currentProduct = await pool.query(
      "SELECT id_seller FROM products WHERE id = ?",
      [id]
    );
    const newProduct = {
      name,
      description,
      price,
      stock,
      id_category,
      url_imagen,
      id_seller: currentProduct[0].id_seller,
    };

    await pool.query("UPDATE products SET ? WHERE id = ?", [newProduct, id]);
    res.redirect("/products/list");
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).send("Error updating product");
  }
});

//añadir carrito
router.post("/cart/add", isLoggedIn, async (req, res) => {
  try {
    const { productId, amount } = req.body;
    const user = req.user;

    if (user.role !== "cliente") {
      return res.redirect("/products/list");
    }

    const existingSale = await pool.query(
      "SELECT * FROM sales WHERE id_product = ? AND id_customer = ? AND status = 0",
      [productId, user.id]
    );

    if (existingSale.length > 0) {
      await pool.query(
        "UPDATE sales SET amount = amount + ? WHERE id_product = ? AND id_customer = ? AND status = 0",
        [amount, productId, user.id]
      );
    } else {
      await pool.query(
        "INSERT INTO sales (id_product, id_customer, amount, status, sale_date) VALUES (?, ?, ?, 0, NOW())",
        [productId, user.id, amount]
      );
    }

    res.redirect("/products/listClient");
  } catch (error) {
    console.error("Error adding to cart:", error);
    res.status(500).send("Error adding to cart");
  }
});

//abrir carrito de compras
router.get("/cart", isLoggedIn, async (req, res) => {
  try {
    const id_customer = req.user.id;
    const user = req.user;
    if (user.role !== "cliente") {
      return res.redirect("/products/list");
    }

    const sales = await pool.query(
      "SELECT p.*, s.amount FROM sales s JOIN products p ON s.id_product = p.id WHERE s.id_customer = ? AND s.status = 0",
      [id_customer]
    );
    res.render("products/cart", { sales });
  } catch (error) {
    console.log(error);
    console.error("Error fetching cart items:", error);
    res.status(500).send("Error fetching cart items");
  }
});

//actualizar

// Aumentar
router.post("/cart/increase/:id", isLoggedIn, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { amount } = req.body;

    if (user.role !== "cliente") {
      return res.redirect("/products/list");
    }

    console.log(`Increasing amount: ${amount}`);

    await pool.query(
      "UPDATE sales SET amount = amount + ? WHERE id_product = ? AND id_customer = ? AND status = 0",
      [amount, id, user.id]
    );

    res.redirect("/products/cart");
  } catch (error) {
    console.error("Error increasing amount in cart:", error);
    res.status(500).send("Error increasing amount in cart");
  }
});

// Disminuir
router.post("/cart/decrease/:id", isLoggedIn, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const { amount } = req.body;

    if (user.role !== "cliente") {
      return res.redirect("/products/list");
    }

    const result = await pool.query(
      "SELECT amount FROM sales WHERE id_product = ? AND id_customer = ? AND status = 0",
      [id, user.id]
    );

    if (result.length > 0) {
      const currentAmount = result[0].amount;
      const newAmount = Math.max(currentAmount - amount, 0);

      if (newAmount === 0) {
        await pool.query(
          "DELETE FROM sales WHERE id_product = ? AND id_customer = ? AND status = 0",
          [id, user.id]
        );
      } else {
        await pool.query(
          "UPDATE sales SET amount = ? WHERE id_product = ? AND id_customer = ? AND status = 0",
          [newAmount, id, user.id]
        );
      }
    }

    res.redirect("/products/cart");
  } catch (error) {
    console.error("Error decreasing amount in cart:", error);
    res.status(500).send("Error decreasing amount in cart");
  }
});

//Delete product
router.post("/cart/remove/:id", isLoggedIn, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    if (user.role !== "cliente") {
      return res.redirect("/products/list");
    }

    await pool.query(
      "DELETE FROM sales WHERE id_product = ? AND id_customer = ? AND status = 0",
      [id, user.id]
    );

    res.redirect("/products/cart");
  } catch (error) {
    console.error("Error removing from cart:", error);
    res.status(500).send("Error removing from cart");
  }
});









//PAGOS



module.exports = router;
