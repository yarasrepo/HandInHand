const jobsHeading = document.querySelector(".jobs-list-container h2");
const jobsContainer = document.querySelector(".jobs-list-container .jobs");
const jobSearch = document.querySelector(".jobs-list-container .job-search");

let searchTerm = "";

// Function to update the job counter
const updateJobCounter = (jobs) => {
  if (jobs.length == 1) {
    jobsHeading.innerHTML = `${jobs.length} Opportunity`;
  } else {
    jobsHeading.innerHTML = `${jobs.length} Opportunities`;
  }
};

// Function to create job listing cards
const createJobListingCards = (jobs) => {
  jobsContainer.innerHTML = "";

  jobs.forEach((job, index) => {
    if (job.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      let jobCard = document.createElement("div");
      jobCard.classList.add("job");

      let image = document.createElement("img");
      image.src = job.image;

      let title = document.createElement("h3");
      title.innerHTML = job.title;
      title.classList.add("job-title");

      let details = document.createElement("div");
      details.innerHTML = job.details;
      details.classList.add("details");

      let detailsBtn = document.createElement("button");
      detailsBtn.innerHTML = "More Details";
      detailsBtn.classList.add("details-btn");
      detailsBtn.addEventListener("click", () => {
        // Toggle visibility of additional details
        const additionalDetails = jobCard.querySelector(".additional-details");
        if (additionalDetails.style.display === "none") {
          additionalDetails.style.display = "block";
        } else {
          additionalDetails.style.display = "none";
        }
      });

      let openPositions = document.createElement("span");
      openPositions.classList.add("open-positions");
      openPositions.innerHTML = `${job.openPositions} open positions`;

      let applyBtn = document.createElement("button");
      applyBtn.innerHTML = "Apply Now";
      applyBtn.classList.add("apply-btn");
      applyBtn.addEventListener("click", () => {
        alert("Thank you! Your application for " + job.title + " has been sent and is waiting acceptance, please be patient!");
      });

      let deleteBtn = document.createElement("button");
      deleteBtn.innerHTML = "Delete";
      deleteBtn.classList.add("delete-btn");
      deleteBtn.addEventListener("click", () => {
        jobs.splice(index, 1);
        localStorage.setItem("jobs", JSON.stringify(jobs));
        createJobListingCards(jobs);
        updateJobCounter(jobs);
      });

      // Additional details section (initially hidden)
      let additionalDetails = document.createElement("div");
      additionalDetails.classList.add("additional-details");
      additionalDetails.style.display = "none";
      additionalDetails.innerHTML = `
        <p><strong>Location:</strong> ${job.location}</p>
        <p><strong>Required Hours:</strong> ${job.requiredHours}</p>
        <p><strong>Required Skills:</strong> ${job.requiredSkills}</p>
      `;

      jobCard.appendChild(image);
      jobCard.appendChild(title);
      jobCard.appendChild(details);
      jobCard.appendChild(detailsBtn);
      jobCard.appendChild(openPositions);
      jobCard.appendChild(applyBtn);
      jobCard.appendChild(deleteBtn);
      jobCard.appendChild(additionalDetails);

      jobsContainer.appendChild(jobCard);
    }
  });
};

// Retrieve jobs from local storage
let jobs = JSON.parse(localStorage.getItem("jobs")) || [];

// Initial setup
updateJobCounter(jobs);
createJobListingCards(jobs);

// Event listener for job search
jobSearch.addEventListener("input", (e) => {
  searchTerm = e.target.value;
  createJobListingCards(jobs);
});
