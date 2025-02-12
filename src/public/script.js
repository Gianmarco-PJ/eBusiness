document.addEventListener("DOMContentLoaded", (event) => {
  const payAllBtn = document.getElementById("payAllBtn");
  const paymentModal = document.getElementById("paymentModal");
  const yapeModal = document.getElementById("yapeModal");
  const cardModal = document.getElementById("cardModal");
  const closeButtons = document.querySelectorAll(".close");

  payAllBtn.onclick = function () {
    paymentModal.style.display = "block";
  };

  closeButtons.forEach((button) => {
    button.onclick = function () {
      this.parentElement.parentElement.style.display = "none";
    };
  });

  window.onclick = function (event) {
    if (event.target === paymentModal) {
      paymentModal.style.display = "none";
    } else if (event.target === yapeModal) {
      yapeModal.style.display = "none";
    } else if (event.target === cardModal) {
      cardModal.style.display = "none";
    }
  };

  document.getElementById("paymentForm").onsubmit = function (event) {
    event.preventDefault();
    const paymentMethod = document.querySelector(
      'input[name="paymentMethod"]:checked'
    ).value;
    if (paymentMethod === "yape") {
      paymentModal.style.display = "none";
      yapeModal.style.display = "block";
    } else if (paymentMethod === "card") {
      paymentModal.style.display = "none";
      cardModal.style.display = "block";
    }
  };
});
