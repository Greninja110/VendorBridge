# Test Cases for Procurement & Vendor Management ERP System

## Table of Contents

- [Test Case 1: User Registration and Login](#test-case-1-user-registration-and-login)
- [Test Case 2: Dashboard/Home Screen](#test-case-2-dashboardhome-screen)
- [Test Case 3: Vendor Management Screen](#test-case-3-vendor-management-screen)
- [Test Case 4: RFQ Creation Screen](#test-case-4-rfq-creation-screen)
- [Test Case 5: Vendor Quotation Submission Screen](#test-case-5-vendor-quotation-submission-screen)
- [Test Case 6: Quotation Comparison Screen](#test-case-6-quotation-comparison-screen)
- [Test Case 7: Approval Workflow Screen](#test-case-7-approval-workflow-screen)
- [Test Case 8: Purchase Order & Invoice Generation Screen](#test-case-8-purchase-order--invoice-generation-screen)
- [Test Case 9: Activity Logs & Notifications Screen](#test-case-9-activity-logs--notifications-screen)
- [Test Case 10: Reports & Analytics Screen](#test-case-10-reports--analytics-screen)

## Test Case 1: User Registration and Login

### Description
**Objective:** Verify that users can successfully register and log in to the
application. **Preconditions:** The system is up and running, and there are no
existing user accounts.

#### Steps
1. Open the application's login screen.
2. Fill out the registration form with valid email, password, and confirm
   password.
3. Click on the "Register" button.
4. Verify that a confirmation message appears indicating successful
   registration.
5. Close the registration form.
6. Open the login screen again.
7. Enter the registered user credentials (email and password).
8. Click on the "Login" button.
9. Verify that the home page is displayed upon successful login.

#### Expected Results
- The user should be able to register a new account successfully.
- The system should display a confirmation message upon successful registration.
- The user should be able to log in using the registered credentials and access
  the application's main dashboard/home screen.

## Test Case 2: Dashboard/Home Screen

### Description
**Objective:** Verify that the dashboard/Home page displays all necessary
information about pending approvals, active RFQs, recent purchase orders, and
recent invoices. **Preconditions:** The system is up and running, and there are
some test data entries in the system.

#### Steps
1. Open the application's login screen.
2. Log in with a registered user account (Procurement Officer or Manager).
3. Navigate to the dashboard/Home page.
4. Verify that the pending approvals section displays active procurement
   requests.
5. Verify that the active RFQs section displays all open RFQs.
6. Verify that the recent purchase orders section displays recently created and
   completed purchase orders.
7. Verify that the recent invoices section displays recently generated and sent
   invoices.

#### Expected Results
- The dashboard/Home page should display relevant data for each section listed
  above.
- All displayed information should be accurate and up-to-date.

## Test Case 3: Vendor Management Screen

### Description
**Objective:** Verify that vendors can be registered, their status can be
tracked, categories can be assigned, GST details can be provided, and contact
details can be updated. **Preconditions:** The system is up and running, and
there are no existing vendor records.

#### Steps
1. Open the application's login screen.
2. Log in with a registered user account (Admin).
3. Navigate to the vendor management section.
4. Click on the "Register Vendor" button.
5. Fill out the registration form with valid details including name, category,
   GST number, and contact information.
6. Submit the form.
7. Verify that the vendor is successfully added to the list of vendors.
8. Select an existing vendor from the list.
9. Verify that the vendor's status, categories, GST details, and contact
   information are displayed correctly.
10. Update any fields (e.g., GST number) and submit the changes.
11. Verify that the updated information is reflected in the system.

#### Expected Results
- The vendor should be added to the list successfully.
- The selected vendor's details should match the provided information.
- The updated information should be correctly saved and displayed.

## Test Case 4: RFQ Creation Screen

### Description
**Objective:** Verify that an RFQ can be created, including setting the title,
product/service details, quantity management, attachments, deadline selection,
and assigning vendors. **Preconditions:** The system is up and running, and
there are no existing RFQs.

#### Steps
1. Open the application's login screen.
2. Log in with a registered user account (Procurement Officer).
3. Navigate to the RFQ creation section.
4. Click on the "Create RFQ" button.
5. Fill out the form with valid details including title, product/service
   details, quantity management, attachments, and deadline.
6. Assign vendors by selecting them from the list or adding new ones.
7. Submit the form.
8. Verify that the RFQ is successfully created and displayed in the dashboard.

#### Expected Results
- The RFQ should be created with all specified details.
- Vendors assigned to the RFQ should appear correctly on the RFQ details page.
- The newly created RFQ should display accurately on the dashboard/Home screen.

## Test Case 5: Vendor Quotation Submission Screen

### Description
**Objective:** Verify that vendors can submit their quotations for an RFQ,
including providing pricing details, delivery timelines, notes/comments, and
editing existing quotations. **Preconditions:** An active RFQ is created and
there are no existing vendor submissions.

#### Steps
1. Open the application's login screen.
2. Log in with a registered user account (Vendor).
3. Navigate to the RFQ management section for an active RFQ.
4. Click on the "Submit Quotation" button.
5. Fill out the quotation form with valid details including pricing, delivery
   timeline, notes/comments, and editable fields.
6. Submit the form.
7. Verify that the quotation is successfully submitted and displayed in the RFQ
   details page.

#### Expected Results
- The vendor's quotation should be added to the list of submissions for the RFQ.
- The quotation's details should match the provided information.
- The newly submitted quotation should display accurately on the RFQ details
  page.

## Test Case 6: Quotation Comparison Screen

### Description
**Objective:** Verify that quotations can be compared, highlighting the lowest
price and delivery timeline differences, with vendor rating indicators and
sorting/filtering options. **Preconditions:** There are at least two vendor
submissions for an active RFQ.

#### Steps
1. Open the application's login screen.
2. Log in with a registered user account (Procurement Officer).
3. Navigate to the RFQ management section for an active RFQ.
4. Click on the "Quotation Comparison" button.
5. Verify that the quotations are displayed side-by-side, with lowest price and
   delivery timeline differences highlighted.
6. Use the sorting/filtering options to organize the displayed data.
7. Verify that the vendor rating indicators (if available) reflect the quality
   of each quotation.

#### Expected Results
- The quotations should be displayed in a side-by-side format for easy
  comparison.
- Low prices and delivery timelines should be clearly highlighted.
- Sorting/filtering options should allow users to easily locate specific details
  within the list.
- Vendor ratings, if provided, should provide insights into the quality of each
  vendor's submission.

## Test Case 7: Approval Workflow Screen

### Description
**Objective:** Verify that approvals can be initiated, managed, and tracked in a
structured workflow, including approving/rejecting actions with remarks,
approval timeline tracking, status updates, and state transitions.
**Preconditions:** An RFQ has been created and there are at least two vendor
submissions.

#### Steps
1. Open the application's login screen.
2. Log in with a registered user account (Manager/Approver).
3. Navigate to the RFQ management section for an active RFQ.
4. Click on the "Approval Workflow" button.
5. Review all submitted quotations and choose one for approval/rejection.
6. Enter approval remarks if necessary.
7. Initiate the approval workflow by clicking the "Approve" or "Reject" button.
8. Verify that the approval status changes to approved/rejected, with
   appropriate remarks displayed.
9. Track the approval timeline and ensure that each step is correctly logged.
10. Update the status of the purchase order (if generated) after approval.

#### Expected Results
- Approvals should be managed in a structured workflow, allowing for tracking
  and updating as necessary.
- Approval actions should include approving/rejecting quotes with optional
  remarks.
- The approval timeline should accurately reflect each step taken during the
  process.
- Approval status updates are reflected correctly on the RFQ details page.

## Test Case 8: Purchase Order & Invoice Generation Screen

### Description
**Objective:** Verify that approved quotations can be converted into purchase
orders and invoices, including generating unique PO numbers, accurate tax
calculations, total calculations, downloading as PDFs, printing invoices,
sending via email, updating status updates, and managing invoice history.
**Preconditions:** A successful approval workflow has been initiated.

#### Steps
1. Open the application's login screen.
2. Log in with a registered user account (Procurement Officer).
3. Navigate to the RFQ management section for an active RFQ.
4. Click on the "Generate Purchase Order" button.
5. Verify that a unique purchase order number is generated and displayed.
6. Confirm that tax calculations, total calculations, and invoice details are
   accurate based on the approved quotation.
7. Download the invoice as a PDF file.
8. Print the invoice using the application's printing functionality.
9. Send an invoice via email by selecting the option from the dropdown menu.
10. Verify that the status of the purchase order is updated to completed after
    generating an invoice.

#### Expected Results
- A unique purchase order number should be generated upon approval and displayed
  correctly.
- Tax calculations, total calculations, and invoice details should match those
  in the approved quotation.
- Invoices can be downloaded as PDFs and printed successfully.
- Invoicing functionality is integrated with email sending, allowing for
  efficient communication with vendors.

## Test Case 9: Activity Logs & Notifications Screen

### Description
**Objective:** Verify that users receive notifications about important
procurement activities, including RFQ notifications, approval alerts, invoice
updates, activity timeline, and audit logs. **Preconditions:** There are some
test data entries in the system and the user has appropriate permissions.

#### Steps
1. Open the application's login screen.
2. Log in with a registered user account (Procurement Officer).
3. Navigate to the "Activity Logs & Notifications" section.
4. Verify that RFQ notifications are displayed for any recent RFQs that require
   attention.
5. Track and confirm approval alerts as they occur during the approval workflow
   process.
6. Monitor invoice updates and ensure they reflect changes in the purchase order
   status.
7. Use the activity timeline to review all procurement-related activities
   performed by the user.
8. Access audit logs for detailed records of user actions, including
   login/logout events.

#### Expected Results
- Notification messages are displayed promptly for important procurement
  activities (RFQ notifications, approval alerts).
- Users can track and confirm approval workflow events.
- Invoice updates reflect changes in the purchase order status accurately.
- The activity timeline provides a clear overview of all relevant
  procurement-related activities performed by the user.
- Audit logs provide detailed records of user actions, ensuring traceability and
  accountability.

## Test Case 10: Reports & Analytics Screen

### Description
**Objective:** Verify that procurement insights and trends can be accessed
through reports and analytics, including vendor performance metrics, procurement
statistics, spending summaries, and monthly procurement trends.
**Preconditions:** There is a history of procurement activities in the system.

#### Steps
1. Open the application's login screen.
2. Log in with a registered user account (Admin).
3. Navigate to the "Reports & Analytics" section.
4. Verify that vendor performance metrics are displayed, including performance
   ratings and historical data.
5. Confirm that procurement statistics provide an overview of total spending and
   trends over time.
6. View spending summaries for specific periods or categories to understand
   financial trends.
7. Analyze monthly procurement trends by reviewing reports displaying sales
   figures, purchase order amounts, etc.

#### Expected Results
- Vendor performance metrics should reflect the quality and efficiency of vendor
  interactions within the system.
- Procurement statistics should provide comprehensive insights into overall
  purchasing activities.
- Spending summaries for specific periods or categories should offer detailed
  financial information to help manage budgets and costs.
- Monthly procurement trends should display sales figures, purchase order
  amounts, etc., allowing for strategic planning and budgeting.

## Conclusion

The above test cases cover a range of functionalities within the Procurement &
Vendor Management ERP system. Each case is designed to verify different aspects
of user interactions and ensure that the application meets the requirements
outlined in the overall vision. This comprehensive testing approach will help
identify potential issues and ensure smooth operation of the platform for all
users.

By following these test cases, developers can systematically evaluate the
performance of the Procurement & Vendor Management ERP system and make necessary
improvements to enhance its usability and effectiveness.