const jobs = [
  {
    title: "Kafa",
    image: "images/Kafa.png",
    details:
      "KAFA (enough) Violence & Exploitation is a Lebanese civil, non-governmental, non-profit, feminist, and secular organization seeking to create a society that is free of social, economic, and legal patriarchal structures that discriminate against women.",
    openPositions: 2,
    link: "#",
    location: "Beirut",
    requiredHours: "24",
    requiredSkills: "Communication, Teamwork",
  },
  {
    title: "Red Cross",
    image: "images/redcross.png",
    details:
      "The Lebanese Red Cross (LRC) is a humanitarian organization and an auxiliary team to the medical service of the Lebanese Army",
    openPositions: 3,
    link: "#",
    location: "Tripoli",
    requiredHours: "12",
    requiredSkills: "First Aid, Emergency Response",
  },
  {
    title: "Bassma",
    image: "images/bassma.png",
    details:
      "A non-profit association for Social Development, founded by a group of dynamic volunteers. They decided to fight poverty and work for a better society by creating a humanitarian organization that rallies citizens for the social Lebanese cause.",
    openPositions: 1,
    link: "#",
    location: "Sidon",
    requiredHours: "24",
    requiredSkills: "Social Work, Empathy",
  },
];

const jobsHeading = document.querySelector(".jobs-list-container h2");
const jobsContainer = document.querySelector(".jobs-list-container .jobs");
const jobSearch = document.querySelector(".jobs-list-container .job-search");
const jobForm = document.getElementById("jobForm");

let searchTerm = "";

// Function to update the job counter
const updateJobCounter = () => {
  if (jobs.length == 1) {
    jobsHeading.innerHTML = `${jobs.length} Opportunity`;
  } else {
    jobsHeading.innerHTML = `${jobs.length} Opportunities`;
  }
};

// Function to create job listing cards
const createJobListingCards = () => {
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
        createJobListingCards();
        updateJobCounter();
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

// Function to handle job submission
const submitJob = (event) => {
  event.preventDefault();

  const jobName = document.getElementById("job_name").value;
  const description = document.getElementById("description").value;
  const openPositions = parseInt(document.getElementById("open_positions").value);
  const location = document.getElementById("location").value; // New field: Location
  const requiredHours = document.getElementById("required_hours").value; // New field: Required Hours
  const requiredSkills = document.getElementById("required_skills").value; // New field: Required Skills
  let imageLink = document.getElementById("image_link").value;

  if (!imageLink) {
    imageLink = "images/logonowords.png"; // Replace with your default image link
  }

  if (jobName && description && !isNaN(openPositions) && openPositions > 0 && location && requiredHours && requiredSkills) {
    jobs.push({
      title: jobName,
      image: "images/logonowords.png", // Set default image or adjust as needed
      details: description,
      openPositions: openPositions,
      location: location,
      requiredHours: requiredHours,
      requiredSkills: requiredSkills, // Include required skills
      link: "#", // Update as needed
    });

    createJobListingCards();
    updateJobCounter();

    // Clear form fields after submission
    jobForm.reset();
  } else {
    alert("Please fill in all fields correctly.");
  }
};

// Initial setup
updateJobCounter();
createJobListingCards();

// Event listeners
jobSearch.addEventListener("input", (e) => {
  searchTerm = e.target.value;
  createJobListingCards();
});

jobForm.addEventListener("submit", submitJob);
