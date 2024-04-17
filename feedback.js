const btn = document.querySelector(".button");
const feedback = document.querySelector(".feedback-container");

btn.addEventListener("click", () => {
    const textareaValue = document.getElementById("textarea").value.trim();
    const nameValue = document.querySelector(".name input").value.trim();
    const emailValue = document.querySelector(".email input").value.trim();
    
    if (textareaValue === "") {
        displayErrorMessage("Please provide your feedback");
    } else if (nameValue === "") {
        displayErrorMessage("Please provide your name");
    } else if (emailValue === "") {
        displayErrorMessage("Please provide your email");
    } else {
        feedback.innerHTML = `<h1>Thank you for your feedback</h1>`;
        setTimeout(() => {
            window.location.href = "/homepage"; 
        }, 1500);
    }
});

function displayErrorMessage(message) {
    const errorMessage = document.createElement("p");
    errorMessage.classList.add("error-message");
    errorMessage.textContent = message;
    feedback.appendChild(errorMessage);
}