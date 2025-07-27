// Find our date picker inputs on the page
const startInput = document.getElementById('startDate');
const endInput = document.getElementById('endDate');
const gallery = document.getElementById('gallery');
const button = document.querySelector('button');

// Call the setupDateInputs function from dateRange.js
// This sets up the date pickers to:
// - Default to a range of 9 days (from 9 days ago to today)
// - Restrict dates to NASA's image archive (starting from 1995)
setupDateInputs(startInput, endInput);

// NASA API configuration - API key is loaded from secret.js
const NASA_API_URL = 'https://api.nasa.gov/planetary/apod';

// Space facts for the "Did You Know?" feature
const spaceFacts = [
  "A day on Venus is longer than its year!",
  "One million Earths could fit inside the Sun.",
  "The Milky Way galaxy contains over 100 billion stars.",
  "Saturn's moon Titan has lakes and rivers of liquid methane.",
  "The International Space Station travels at 17,500 mph.",
  "Jupiter's Great Red Spot is a storm larger than Earth.",
  "Neutron stars are so dense that a teaspoon would weigh 6 billion tons.",
  "The universe is approximately 13.8 billion years old."
];

// Display a random space fact
function displayRandomSpaceFact() {
  const randomFact = spaceFacts[Math.floor(Math.random() * spaceFacts.length)];
  const factElement = document.createElement('div');
  factElement.className = 'space-fact';
  factElement.innerHTML = `<strong>🌟 Did You Know?</strong> ${randomFact}`;
  document.querySelector('.container').insertBefore(factElement, document.querySelector('.filters'));
}

// Generate array of dates between start and end date
function getDateRange(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  // Add one day at a time until we reach the end date
  while (current <= end) {
    dates.push(current.toISOString().split('T')[0]);
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
}

// Fetch NASA APOD data for a single date
async function fetchAPODData(date) {
  try {
    const response = await fetch(`${NASA_API_URL}?api_key=${NASA_API_KEY}&date=${date}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch data for ${date}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching APOD data:', error);
    return null;
  }
}

// Fetch APOD data for multiple dates
async function fetchMultipleAPODData(dates) {
  const promises = dates.map(date => fetchAPODData(date));
  const results = await Promise.all(promises);
  return results.filter(result => result !== null);
}

// Create gallery item HTML
function createGalleryItem(apodData) {
  const { title, date, url, media_type, explanation } = apodData;
  
  return `
    <div class="gallery-item" data-apod='${JSON.stringify(apodData)}'>
      ${media_type === 'image' 
        ? `<img src="${url}" alt="${title}" loading="lazy">` 
        : `<div class="video-thumbnail">
             <div class="play-button">▶️</div>
             <p>Video: ${title}</p>
           </div>`
      }
      <div class="item-info">
        <h3>${title}</h3>
        <p class="date">${new Date(date).toLocaleDateString()}</p>
      </div>
    </div>
  `;
}

// Display loading message
function showLoading() {
  gallery.innerHTML = `
    <div class="placeholder">
      <div class="placeholder-icon">⏳</div>
      <p>Loading amazing space images...</p>
    </div>
  `;
}

// Display gallery items
function displayGallery(apodDataArray) {
  if (apodDataArray.length === 0) {
    gallery.innerHTML = `
      <div class="placeholder">
        <div class="placeholder-icon">❌</div>
        <p>No images found for the selected date range. Please try different dates.</p>
      </div>
    `;
    return;
  }

  const galleryHTML = apodDataArray
    .map(createGalleryItem)
    .join('');
  
  gallery.innerHTML = galleryHTML;
  
  // Add click event listeners to gallery items
  const galleryItems = gallery.querySelectorAll('.gallery-item');
  galleryItems.forEach(item => {
    item.addEventListener('click', () => {
      const apodData = JSON.parse(item.dataset.apod);
      openModal(apodData);
    });
  });
}

// Create and show modal
function openModal(apodData) {
  const { title, date, url, media_type, explanation } = apodData;
  
  // Create modal HTML
  const modalHTML = `
    <div class="modal-overlay" id="modal">
      <div class="modal-content">
        <button class="modal-close" onclick="closeModal()">&times;</button>
        <div class="modal-header">
          <h2>${title}</h2>
          <p class="modal-date">${new Date(date).toLocaleDateString('en-US', { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
          })}</p>
        </div>
        <div class="modal-media">
          ${media_type === 'image' 
            ? `<img src="${url}" alt="${title}">` 
            : `<iframe src="${url}" frameborder="0" allowfullscreen></iframe>`
          }
        </div>
        <div class="modal-description">
          <p>${explanation}</p>
        </div>
      </div>
    </div>
  `;
  
  // Add modal to page
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Prevent body scroll when modal is open
  document.body.style.overflow = 'hidden';
}

// Close modal function (needs to be global for onclick attribute)
window.closeModal = function() {
  const modal = document.getElementById('modal');
  if (modal) {
    modal.remove();
    document.body.style.overflow = 'auto';
  }
};

// Handle close modal with escape key
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    closeModal();
  }
});

// Main function to fetch and display space images
async function getSpaceImages() {
  const startDate = startInput.value;
  const endDate = endInput.value;
  
  if (!startDate || !endDate) {
    alert('Please select both start and end dates.');
    return;
  }
  
  // Show loading state
  showLoading();
  
  try {
    // Get array of dates between start and end using the function from dateRange.js
    const dates = getDateRange(startDate, endDate);
    
    // Limit to 9 days maximum
    const limitedDates = dates.slice(0, 9);
    
    // Fetch APOD data for all dates
    const apodDataArray = await fetchMultipleAPODData(limitedDates);
    
    // Display the gallery
    displayGallery(apodDataArray);
    
  } catch (error) {
    console.error('Error loading space images:', error);
    gallery.innerHTML = `
      <div class="placeholder">
        <div class="placeholder-icon">❌</div>
        <p>Error loading images. Please try again.</p>
      </div>
    `;
  }
}

// Add event listener to the button
button.addEventListener('click', getSpaceImages);

// Display random space fact when page loads
displayRandomSpaceFact();
