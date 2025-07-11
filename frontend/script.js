

function showSignup() {
    document.querySelector(".overlay-signup").style.display = 'block';
}
function showLogin() {
    document.querySelector(".overlay-login").style.display = 'block';
}

function closepop1() {
    document.querySelector(".overlay-signup").style.display = "none";
}
function closepop2() {
    document.querySelector(".overlay-login").style.display = "none";
}

function showLogout() {
    const dropdown = document.querySelector(".logoutDropdown");
    if (dropdown.style.display === "block") {
        dropdown.style.display = "none";
    } else {
        dropdown.style.display = "block";
    }
}


document.addEventListener('click', function(event) {
    const profileDiv = document.querySelector('.header-profile');
    const dropdown = document.querySelector('.logoutDropdown');
    if (!profileDiv.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.style.display = 'none';
    }
});


function closeform() {
    document.querySelector(".my-posts").style.display = "none";
}
function closeform2() {
    document.querySelector(".freelancer-details").style.display = "none";
}

function validatePassword(password) {
    const strongRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+{}\[\]:;<>,.?~\\/-]).{5,}$/;
    return strongRegex.test(password);
}


async function signup() {
    const name = document.getElementById("signup-name").value;
    const email = document.getElementById("signup-email").value;
    const password = document.getElementById("signup-password").value;
    const option = document.getElementById("signup-option").value;

    if (password.length < 5) {
        alert("Password length should be more than 5 characters.");
        return;
    }
    const validate = validatePassword(password);

    if (!validate) {
        alert("Password should contain at least one uppercase, one lowercase, one digit and one special character.");
        return;
    }

    let endpoint = '';
    if (option === "employer") {
        endpoint = '/signup-employer';
    } else if (option === "freelancer") {
        endpoint = '/signup-freelancer';
    } else {
        alert("Please select an account type.");
        return;
    }

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, password })
        });
        const data = await response.json();
        if (response.ok) {
            document.querySelector(".overlay-signup").style.display = "none";
            alert(`Signup successful as a ${option}!`);
        } else {
            alert(data.error || "Signup unsuccessful. Please try again!");
        }
    } catch (error) {
        console.error("Error during signup:", error);
        alert("An error occurred during signup. Please try again later.");
    }
}

async function login() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    const option = document.getElementById("login-option").value;

    let endpoint = '';
    let redirectPage = '';
    if (option === "employer") {
        endpoint = '/login-employer';
        redirectPage = 'employer.html';
    } else if (option === "freelancer") {
        endpoint = '/loginFreelancer'; // Corrected to match server.js endpoint
        redirectPage = 'freelancer.html';
    } else {
        alert("Please select an account type.");
        return;
    }

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok) {
            // Store user data in localStorage
            if (option === "employer") {
                localStorage.setItem("employerId", data.data.id);
                localStorage.setItem("employerName", data.data.name);
            } else { // freelancer
                localStorage.setItem("freelancerId", data.data.id);
                localStorage.setItem("freelancerName", data.data.name);
            }
            localStorage.setItem("loggedInEmail", email);
            localStorage.setItem("loggedInUserType", option); // Store user type
            const token = btoa(email + ":" + Date.now()); // Simple token for session check
            localStorage.setItem("userToken", token);

            document.querySelector(".overlay-login").style.display = "none"; // Close login popup
            alert("Login successful! 🤩");
            location.href = redirectPage;
        } else {
            alert(data.message || data.error || "Invalid Credentials. Please try again.");
        }
    } catch (error) {
        console.error("Error during login:", error);
        alert("An error occurred during login. Please try again later.");
    }
}



async function displayEmployerDashboard() {
    const employerId = localStorage.getItem("employerId");
    const employerName = localStorage.getItem("employerName");

    if (!employerId || !employerName) {
        alert("Employer data not found. Please login again.");
        window.location.href = "index.html";
        return;
    }

    document.querySelector(".showName").innerHTML = `<h2>👋 Welcome back, ${employerName.toUpperCase()}</h2>`;

    try {
        const response = await fetch('/emp_posts', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ employerId })
        });
        const postsData = await response.json();

        let totalApplications = 0;
        let totalHires = 0; 
        if (postsData && postsData.length > 0) {
            document.querySelector(".main-content").innerHTML = ""; 
            document.querySelector(".totalPosts").textContent = postsData.length;

            for (const post of postsData) {
                const postedDate = new Date(post.posted_date).toLocaleDateString();
                const applicantsRes = await fetch(`/applicants-for-post/${post.post_id}`);
                const applicantsData = await applicantsRes.json();

                totalApplications += applicantsData.length; 
                let applicantsHtml = '';
                if (applicantsData.length > 0) {
                    applicantsHtml = '<h4>Applicants:</h4><ul class="applicants-list">';
                    applicantsData.forEach(applicant => {
                        const completionStatus = applicant.completion_file_path ?
                            `<a href="${applicant.completion_file_path}" target="_blank" class="download-link">Download Completion File</a>` :
                            'No file uploaded';
                        applicantsHtml += `
                            <li>
                                ${applicant.freelancer_name} (${applicant.freelancer_email}) - Status: ${applicant.status}
                                <button class="chat-btn" onclick="openChatBox(${applicant.freelancer_id}, '${applicant.freelancer_name}', ${post.post_id})">💬 Chat</button>
                                <p>Completion: ${completionStatus}</p>
                            </li>`;
                    });
                    applicantsHtml += '</ul>';
                } else {
                    applicantsHtml = '<p>No applicants yet for this post.</p>';
                }

                const item = `<div class='main-freeLancer'>
                                <div class="freelancer-image"></div>
                                <h2>${post.title}</h2>
                                <p>${post.description}</p>
                                <p>Skills: ${post.skills}</p>
                                <p>Budget: ${post.money} ₹</p>
                                <p>Deadline: ${new Date(post.posted_date).toLocaleDateString()}</p>
                                <p>Posted on: ${postedDate}</p>
                                <div class="post-applicants-section">
                                    ${applicantsHtml}
                                </div>
                            </div>`;
                document.querySelector('.main-content').innerHTML += item;
            }
        } else {
            document.querySelector(".main-content").innerHTML = "<p>You haven't posted any jobs yet.</p>";
            document.querySelector(".totalPosts").textContent = "0";
        }

        document.querySelector(".applicationsReceived").textContent = totalApplications;
        document.querySelector(".hiresCompleted").textContent = totalHires;

    } catch (error) {
        console.error("Error displaying employer dashboard:", error);
        document.querySelector(".main-content").innerHTML = "<p>Error loading your posts. Please try again.</p>";
    }
}


function addpost() {
    document.querySelector(".my-posts").style.display = "block";
    document.getElementById("post-title").value = '';
    document.getElementById("post-skills").value = '';
    document.getElementById("post-details").value = '';
    document.getElementById("post-money").value = '';
    document.getElementById("post-date").value = '';
}

async function submitpost() {
    const title = document.getElementById("post-title").value;
    const description = document.getElementById("post-details").value;
    const skills = document.getElementById("post-skills").value;
    const money = document.getElementById("post-money").value;
    const date = document.getElementById("post-date").value;
    const employerId = localStorage.getItem("employerId");

    if (!title || !description || !skills || !money || !date) {
        alert("Please fill all fields to add a post.");
        return;
    }
    if (isNaN(money) || parseFloat(money) <= 0) {
        alert("Please enter a valid budget amount.");
        return;
    }

    try {
        const response = await fetch('/addpost', {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, description, skills, money: parseFloat(money), date, employerId })
        });

        const data = await response.json();
        if (response.ok) {
            alert("Post added successfully!");
            document.querySelector(".my-posts").style.display = "none";
            displayEmployerDashboard(); // Refresh posts
        } else {
            alert(data.error || "Failed to add post. Please try again.");
        }
    } catch (error) {
        console.error("Error submitting post:", error);
        alert("An error occurred while adding the post. Please try again later.");
    }
}



let currentUploadApplicationId = null;

async function displayPosts() {
    const freelancerId = localStorage.getItem("freelancerId");
    const freelancerName = localStorage.getItem("freelancerName");
    const loggedInEmail = localStorage.getItem("loggedInEmail");

    if (!freelancerId || !freelancerName || !loggedInEmail) {
        alert("Freelancer data not found. Please login again.");
        window.location.href = "index.html";
        return;
    }

    document.querySelector(".showName").innerHTML = `<h2>👋 Welcome back, ${freelancerName.toUpperCase()}</h2>`;

    try {
        const response = await fetch('/posts', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({}) 
        });
        const allPostsData = await response.json();

        
        const freelancerApplications = await fetchFreelancerApplications(freelancerId);


        if (allPostsData && allPostsData.length > 0) {
            document.querySelector(".main-content").innerHTML = ""; 
            allPostsData.forEach(element => {
                const postId = element.post_id;
                const postedDate = new Date(element.posted_date).toLocaleDateString();

                const application = freelancerApplications.find(app => app.post_id === postId);
                const isApplied = !!application;
                const applicationStatus = application ? application.status : 'not_applied';
                const applicationId = application ? application.application_id : null;
                const completionFilePath = application ? application.completion_file_path : null;

                let actionButtons = '';
                if (isApplied) {
                    actionButtons += `<button class="message-btn" onclick="openChat(${postId}, ${element.EMPLOYER_ID})">💬 Message Employer</button>`;
                    if (applicationStatus === 'pending' || applicationStatus === 'accepted') { 
                        actionButtons += `<button class="upload-completion-btn" onclick="openCompletionUploadPopup(${applicationId})">⬆️ Upload Completion</button>`;
                    }
                    if (completionFilePath) {
                        actionButtons += `<a href="${completionFilePath}" target="_blank" class="download-link">Download My Upload</a>`;
                    }
                } else {
                    actionButtons = `<button class="apply-btn" onclick="applyToJob(${postId})">Apply Now</button>`;
                }

                const item = `<div class='main-posts'>
                                <img src="main-img.jpg" alt="Project Image" class="post-image" />
                                <h2>${element.title}</h2>
                                <p>${element.description}</p>
                                <h3>Skills: ${element.skills}</h3>
                                <p>Budget: ${element.money} ₹</p>
                                <h3>Posted on: ${postedDate}</h3>
                                <div class="post-actions"> <!-- NEW: Wrap buttons in this div -->
                                    ${actionButtons}
                                </div>
                            </div>`;
                document.querySelector('.main-content').innerHTML += item;
            });
        } else {
            document.querySelector(".main-content").innerHTML = "<p>No job posts available at the moment.</p>";
        }
    } catch (error) {
        console.error("Error displaying posts:", error);
        document.querySelector(".main-content").innerHTML = "<p>Error loading job posts. Please try again.</p>";
    }
}


async function fetchFreelancerApplications(freelancerId) {
    try {
        const res = await fetch(`/freelancer-applications/${freelancerId}`);
        if (res.ok) {
            return await res.json();
        } else {
            console.error("Failed to fetch freelancer applications:", res.status);
            return [];
        }
    } catch (error) {
        console.error("Error fetching freelancer applications:", error);
        return [];
    }
}


async function applyToJob(postId) {
    const email = localStorage.getItem("loggedInEmail");
    if (!email) {
        alert("You must be logged in to apply.");
        return;
    }

    try {
        const res = await fetch("/apply", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ post_id: postId, freelancer_email: email })
        });

        const data = await res.json();
        if (res.ok) {
            alert("Application submitted successfully!");
            displayPosts(); 
        } else {
            alert(data.error || "Something went wrong with your application.");
        }
    } catch (error) {
        console.error("Error applying to job:", error);
        alert("An error occurred while submitting your application. Please try again later.");
    }
}

function updateDetails() {
    document.querySelector(".freelancer-details").style.display = "block";

    const freelancerName = localStorage.getItem("freelancerName");
    const loggedInEmail = localStorage.getItem("loggedInEmail");
    document.getElementById("freelancer-name").value = freelancerName || '';
    document.getElementById("freelancer-email").value = loggedInEmail || '';
}

async function submitFreelancerDetails() {
    const name = document.getElementById("freelancer-name").value;
    const email = document.getElementById("freelancer-email").value;
    const phoneNumber = document.getElementById("freelancer-phone").value;
    const location = document.getElementById("freelancer-location").value;
    const skills = document.getElementById("freelancer-skills").value;
    const experience = document.getElementById("freelancer-experience").value;
    const portfolio = document.getElementById("freelancer-portfolio").value;
    const glink = document.getElementById("freelancer-link").value;
    const availablity = document.getElementById("freelancer-availability").value;
    const rate = document.getElementById("freelancer-rate").value;
    const freelancerId = localStorage.getItem("freelancerId"); 

    if (!freelancerId || !name || !email || !skills) {
        alert("Missing required freelancer details or ID.");
        return;
    }

    try {
        const response = await fetch('/updateDetails', {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                freelancerId, 
                name, email, phoneNumber, location, skills,
                experience: parseInt(experience),
                portfolio, glink, availablity,
                rate: parseFloat(rate) 
            })
        });

        const data = await response.json();
        if (response.ok) {
            alert("Details updated successfully!");
            document.querySelector(".freelancer-details").style.display = "none";
            
            localStorage.setItem("freelancerName", name);
            displayPosts(); 
        } else {
            alert(data.error || "Failed to update details. Please try again.");
        }
    } catch (error) {
        console.error("Error updating freelancer details:", error);
        alert("An error occurred while updating details. Please try again later.");
    }
}



let currentChatPostId = null;
let currentChatReceiverId = null; 
let currentChatReceiverName = null; 


function openChat(postId, employerId) {
    currentChatPostId = postId;
    currentChatReceiverId = employerId; 
    currentChatReceiverName = "Employer";

    document.getElementById("chatTitle").innerText = `Chat with Employer (Post ID: ${postId})`;
    document.getElementById("chatPopup").style.display = "block";
    fetchChatMessages();
}


function openChatBox(freelancerId, freelancerName, postId) {
    currentChatPostId = postId;
    currentChatReceiverId = freelancerId; 
    currentChatReceiverName = freelancerName;

    document.getElementById("chatTitle").innerText = `Chat with ${freelancerName} (Post ID: ${postId})`;
    document.getElementById("chatPopup").style.display = "block";
    fetchChatMessages();
}

function closeChat() {
    document.getElementById("chatPopup").style.display = "none";
    document.getElementById("chatMessages").innerHTML = "";
    currentChatPostId = null;
    currentChatReceiverId = null;
    currentChatReceiverName = null;
}

async function fetchChatMessages() {
    const loggedInUserType = localStorage.getItem("loggedInUserType");
    const loggedInUserId = loggedInUserType === "employer" ? localStorage.getItem("employerId") : localStorage.getItem("freelancerId");
    const otherPartyId = currentChatReceiverId;

    if (!currentChatPostId || !loggedInUserId || !otherPartyId) {
        console.error("Missing chat parameters for fetching messages.");
        return;
    }

    try {
        const res = await fetch(`/messages?post_id=${currentChatPostId}&freelancer_id=${loggedInUserType === 'freelancer' ? loggedInUserId : otherPartyId}&employer_id=${loggedInUserType === 'employer' ? loggedInUserId : otherPartyId}`);
        const messages = await res.json();
        const chatMessagesBox = document.getElementById("chatMessages");
        chatMessagesBox.innerHTML = "";

        if (messages.length === 0) {
            chatMessagesBox.innerHTML = "<p>No messages yet. Start the conversation!</p>";
            return;
        }

        messages.forEach(msg => {
            const isSender = (msg.sender_id == loggedInUserId);
            const senderLabel = isSender ? "You" : currentChatReceiverName;
            const messageClass = isSender ? "my-message" : "other-message";
            const timestamp = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            chatMessagesBox.innerHTML += `
                <div class="chat-message ${messageClass}">
                    <span class="sender-name">${senderLabel}:</span>
                    <p>${msg.message}</p>
                    <span class="message-time">${timestamp}</span>
                </div>`;
        });
        chatMessagesBox.scrollTop = chatMessagesBox.scrollHeight;
    } catch (error) {
        console.error("Error fetching messages:", error);
        document.getElementById("chatMessages").innerHTML = "<p>Error loading messages.</p>";
    }
}

async function sendMessage() {
    const messageInput = document.getElementById("chatInput");
    const message = messageInput.value.trim();

    if (!message) return;

    const loggedInUserType = localStorage.getItem("loggedInUserType");
    const senderId = loggedInUserType === "employer" ? localStorage.getItem("employerId") : localStorage.getItem("freelancerId");
    const receiverId = currentChatReceiverId;
    const postId = currentChatPostId;

    if (!senderId || !receiverId || !postId) {
        alert("Cannot send message: missing chat context.");
        return;
    }

    try {
        const res = await fetch("/messages", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                post_id: postId,
                sender_id: senderId,
                receiver_id: receiverId,
                message: message
            })
        });

        if (res.ok) {
            messageInput.value = "";
            fetchChatMessages();
        } else {
            const errorData = await res.json();
            alert("Failed to send message: " + (errorData.error || "Unknown error"));
        }
    } catch (error) {
        console.error("Error sending message:", error);
        alert("An error occurred while sending the message.");
    }
}

function sendFreelancerMessage() {
    sendMessage();
}

function sendEmployerMessage() {
    sendMessage();
}



function openCompletionUploadPopup(applicationId) {
    currentUploadApplicationId = applicationId;
    document.getElementById("completionUploadPopup").style.display = "block";
    document.getElementById("completionFileInput").value = ''; 
}

function closeCompletionUploadPopup() {
    document.getElementById("completionUploadPopup").style.display = "none";
    currentUploadApplicationId = null;
}

async function uploadCompletionFile() {
    if (!currentUploadApplicationId) {
        alert("No application selected for file upload.");
        return;
    }

    const fileInput = document.getElementById("completionFileInput");
    const file = fileInput.files[0];

    if (!file) {
        alert("Please select a file to upload.");
        return;
    }

    const formData = new FormData();
    formData.append('completionFile', file); 
    try {
        const response = await fetch(`/upload-completion/${currentUploadApplicationId}`, {
            method: 'POST',
            body: formData 
        });

        const data = await response.json();
        if (response.ok) {
            alert("Project completion file uploaded successfully!");
            closeCompletionUploadPopup();
            displayPosts(); 
        } else {
            alert(data.error || "Failed to upload file. Please try again.");
        }
    } catch (error) {
        console.error("Error uploading completion file:", error);
        alert("An error occurred during file upload. Please try again later.");
    }
}


function logout() {
    localStorage.clear(); 
    alert("You have been logged out.");
    setTimeout(() => {
        window.location.href = "index.html";
    }, 500);
}
document.addEventListener("DOMContentLoaded", () => {
    const userToken = localStorage.getItem("userToken");
    const loggedInUserType = localStorage.getItem("loggedInUserType");

    if (!userToken) {
        if (window.location.pathname.endsWith("employer.html") || window.location.pathname.endsWith("freelancer.html")) {
            alert("Please login first.");
            window.location.href = "index.html";
        }
    } else {
        if (window.location.pathname.endsWith("employer.html")) {
            displayEmployerDashboard();
        } else if (window.location.pathname.endsWith("freelancer.html")) {
            displayPosts();
        }
    }
});
