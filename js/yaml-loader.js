//THIS FILE DOES NOT PERTAIN TO boss-models.html code configuration embeds.
//All yaml files loaded in boss-models.html are handled by atomix-boss-renderer.js
//This file handles all code embeds on other pages.


async function displayFileInPreTag(filePath, elementId) {
  // Find the <pre> tag using the provided ID
  const preTag = document.querySelector(`#${elementId}`);

  // If the element doesn't exist, exit the function to prevent errors
  if (!preTag) {
    console.error(`Error: Element with ID "${elementId}" not found.`);
    return;
  }

  try {
    // Fetch the file from the provided path
    const response = await fetch(filePath);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const fileText = await response.text();
    
    // Set the text content of the found <pre> tag
    preTag.textContent = fileText;

  } catch (error) {
    console.error(`Error fetching file "${filePath}":`, error);
    preTag.textContent = `Error: Could not load file from ${filePath}.`;
  }
}

// Wait for the page to load before running the function, taking the corresponding code files and implanting them in the <pre> tag with appropriate ID
window.addEventListener('DOMContentLoaded', () => {
  displayFileInPreTag('../atomix/code/level-up-configuration.yml', 'level-up-config-display');

  displayFileInPreTag('../atomix/code/level-up-code.yml', 'level-up-code');

  displayFileInPreTag('../atomix/code/level-up-cost-curves.yml', 'level-up-cost-curves-configuration');

  displayFileInPreTag('../atomix/code/void-tutorial-script.yml', 'void-tutorial-script');

  displayFileInPreTag('../atomix/code/prison-tutorial-script.yml', 'prison-tutorial-script');
  
  displayFileInPreTag('../atomix/code/tournament-config.yml', 'tournament-config');
  
  displayFileInPreTag('../atomix/code/tournament-code.yml', 'tournament-code');

  displayFileInPreTag('../atomix/code/temple-gamestate-code.yml', 'temple-gamestate-code');
});