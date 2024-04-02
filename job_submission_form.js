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
      // Create a new job object
      const newJob = {
        title: jobName,
        image: imageLink,
        details: description,
        openPositions: openPositions,
        location: location,
        requiredHours: requiredHours,
        requiredSkills: requiredSkills,
        link: "#", // Update as needed
      };
  
      // Retrieve existing jobs from local storage or initialize an empty array
      let jobs = JSON.parse(localStorage.getItem("jobs")) || [];
  
      // Add the new job to the jobs array
      jobs.push(newJob);
  
      // Save the updated jobs array back to local storage
      localStorage.setItem("jobs", JSON.stringify(jobs));
  
      // Redirect to the original page (jobs listing page)
      window.location.href = "Posts.html"; // Replace with the actual filename of your original page
    } else {
      alert("Please fill in all fields correctly.");
    }
  };
  
  // Event listener for form submission
  document.getElementById("jobForm").addEventListener("submit", submitJob);
  