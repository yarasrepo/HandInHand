const jobs = [
  {
    title: "Kafa",
    image: "images/Kafa.png",
    details:
      "KAFA (enough) Violence & Exploitation is a Lebanese civil, non-governmental, non-profit, feminist, and secular organization seeking to create a society that is free of social, economic, and legal patriarchal structures that discriminate against women.",
    openPositions: 2,
    link: "#",
  },
  {
    title: "Red Cross",
    image: "images/redcross.png",
    details:
      "The Lebanese Red Cross (LRC) is a humanitarian organization and an auxiliary team to the medical service of the Lebanese Army",
    openPositions: 3,
    link: "#",
  },
  {
    title: "Bassma",
    image: "images/bassma.png",
    details:
      "A non-profit association for Social Development, founded by a group of dynamic volunteers. They decided to fight poverty and work for a better society by creating a humanitarian organization that rallies citizens for the social Lebanese cause.",
    openPositions: 1,
    link: "#",
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

      let detailsBtn = document.createElement("a");
      detailsBtn.href = job.link;
      detailsBtn.innerHTML = "More Details";
      detailsBtn.classList.add("details-btn");

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

      
      jobCard.appendChild(image);
      jobCard.appendChild(title);
      jobCard.appendChild(details);
      jobCard.appendChild(detailsBtn);
      jobCard.appendChild(openPositions);
      jobCard.appendChild(applyBtn);
      jobCard.appendChild(deleteBtn);

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
  let imageLink = document.getElementById("image_link").value;

    if (!imageLink) {
        imageLink = "images/logonowords.png"; // Replace with your default image link
    }

  if (jobName && description && !isNaN(openPositions) && openPositions > 0) {
    jobs.push({
      title: jobName,
      image: "images/logonowords.png", // Set default image or adjust as needed
      details: description,
      openPositions: openPositions,
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
