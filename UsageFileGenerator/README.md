# Billingplatform FastTrak Testing tool

This project is a simple user interface built with HTML, CSS, and JavaScript. It allows users to select a plan type, choose products, and specify a region. Upon submission, the selected options are displayed on the screen.

## Project Structure

```
my-js-ui-project
├── src
│   ├── index.html      # HTML structure of the user interface
│   ├── styles.css      # Styles for the user interface
│   ├── *.js            # Required js files to accomplish the job.
│   └── app.js          # JavaScript logic for handling user interactions
├── server.js           # Node.js server setup
├── package.json        # npm configuration file
└── README.md           # Project documentation
```

## Features

- Dropdown selection for "Plan Type" with options: Standard, Enterprise, Pro, Data, Data Plus.
- Checkboxes for "Products" with options: User, Data, Compute.
- Checkboxes for "Region" with options: Non-Region, US, EU.
- A "Submit" button that displays the selected options below the form.

## Getting Started

1. Clone the repository:
   ```
   git clone https://github.com/nr-vamsi/bp_testing.git
   ```

2. Navigate to the project directory:
   ```
   cd BP_Testing_FrontEnd_Application
   ```

3. Install dependencies:
   ```
   npm install
   ```

4. Start the server:
   ```
   node server.js
   ```

5. Open your web browser and go to:
   ```
   http://localhost:3000
   ```

## Usage

- Select a plan type from the dropdown menu.
- Check the products you are interested in.
- Select the region you want to specify.
- Click the "Submit" button to see your selections displayed below.

## License

This project is licensed under the MIT License.
