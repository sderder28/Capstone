# Savrchef - Smart Recipe Management

A modern, clean web application for discovering, saving, and managing recipes. Built with HTML, CSS, and JavaScript.

## Features

- **Modern UI Design**: Clean, responsive design with smooth animations
- **Recipe Search**: Search for recipes by ingredients, cuisine, or dietary preferences
- **Recipe Filtering**: Filter recipes by category (Quick & Easy, Vegetarian, Gluten-Free, etc.)
- **Favorites System**: Save and manage your favorite recipes
- **Recipe Details**: View detailed recipe information with ingredients and instructions
- **Enhanced Ingredient Matching**: AI-powered ingredient matching using Spoonacular API for better accuracy
- **Mobile Responsive**: Optimized for all device sizes
- **Interactive Elements**: Hover effects, smooth scrolling, and dynamic content

## Project Structure

```
savrchef/
├── index.html          # Main HTML file
├── styles.css          # CSS styles and responsive design
├── script.js           # JavaScript functionality and interactions
├── recipe.js           # Recipe details and enhanced ingredient matching
├── results.js          # Search results functionality
├── config.js           # API configuration
└── README.md           # Project documentation
```

## Features Breakdown

### Enhanced Ingredient Matching
- **API-Powered Matching**: Uses Spoonacular API for intelligent ingredient categorization
- **Alias Recognition**: Handles common ingredient variations and aliases (e.g., "tomato" matches "tomatoes", "roma tomato")
- **Category Matching**: Matches ingredients based on food categories and nutritional properties
- **Unit Compatibility**: Considers measurement unit compatibility for ingredient matching
- **Caching System**: Caches ingredient information for improved performance
- **Fallback System**: Gracefully falls back to hardcoded matching if API is unavailable
- **Loading Indicators**: Shows progress during enhanced matching process

### Navigation
- Sticky navigation bar with smooth scrolling
- Mobile-responsive hamburger menu
- Active page highlighting

### Hero Section
- Engaging call-to-action
- Animated recipe card preview
- Gradient buttons with hover effects

### Search Functionality
- Real-time search input with suggestions
- Category filters for quick recipe discovery
- Search results notifications

### Recipe Cards
- Hover effects with overlay actions
- Favorite button functionality
- Quick view modal with detailed recipe information
- Responsive grid layout

### Interactive Elements
- Smooth scrolling navigation
- Loading animations
- Notification system
- Modal dialogs
- Dynamic content updates

## Design Features

### Color Scheme
- Primary: Orange gradient (#ff6b35 to #f7931e)
- Secondary: Clean whites and grays
- Accent: Dark blue (#2c3e50) for footer

### Typography
- Inter font family for modern readability
- Responsive font sizes
- Proper hierarchy and spacing

### Animations
- Smooth transitions on all interactive elements
- Fade-in animations for recipe cards
- Hover effects and transforms
- Loading states and feedback

## Browser Compatibility

- Chrome (recommended)
- Firefox
- Safari
- Edge
- Mobile browsers

## Future Enhancements

- Backend integration for real recipe data
- User authentication and profiles
- Recipe creation and sharing
- Advanced search filters
- Recipe ratings and reviews
- Shopping list functionality
- Meal planning features

## Development

This project uses vanilla web technologies:
- **HTML5**: Semantic markup
- **CSS3**: Modern styling with Flexbox and Grid
- **JavaScript (ES6+)**: Modern JavaScript features
- **Font Awesome**: Icons
- **Google Fonts**: Typography

## License

This project is open source and available under the MIT License.

---


**Savrchef** -Save more, Savor more.

