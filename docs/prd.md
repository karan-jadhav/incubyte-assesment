# Product Requirements Document: Salary Management Tool

## Overview

ACME currently manages employee salary data in spreadsheets. This works for a small team, but becomes hard to maintain when the organization has thousands of employees across multiple countries. HR managers need a simple way to manage employee records and answer basic salary-related questions without manually filtering and calculating data in spreadsheets.

This product is a minimal salary management tool for an organization with 10,000 employees. It focuses on two core jobs: managing employee salary records and viewing salary insights by country and job title.

The goal is not to build a complete payroll or compensation platform. The goal is to provide a clean, reliable, and usable internal tool that solves the most common HR workflow around salary data.

## Target User

The primary user is an HR Manager.

The HR Manager is responsible for maintaining employee salary records and understanding how employees are paid across countries, roles, and departments. They may not be technical, so the product should be easy to use, predictable, and fast enough for day-to-day work.

## Problem

Salary data is currently managed through spreadsheets. This creates a few problems:

* Employee records are harder to keep consistent.
* Filtering and updating large spreadsheets is tedious.
* Salary calculations are manual and error-prone.
* It is difficult to quickly answer questions like:

  * What is the average salary in a country?
  * What is the highest and lowest salary in a country?
  * What is the average salary for a job title in a country?
  * Which countries or roles have higher salary ranges?

For 10,000 employees, the tool should feel responsive and should not require the HR Manager to manually process data.

## Goals

The product should allow an HR Manager to:

* Add, view, update, and delete employee records.
* Search and filter employees.
* View salary insights by country.
* View salary insights for a job title within a country.
* Work with a seeded dataset of 10,000 employees.
* Use the application through a simple web UI.
* Run the project locally with clear setup instructions.

## Non-Goals

The following features are intentionally out of scope for this version:

* Authentication and role-based access control.
* Audit history for salary changes.
* Salary approval workflows.
* Payroll processing.
* Tax calculations.
* Multi-currency conversion.
* CSV or Excel import/export.
* Employee performance or appraisal data.
* Organization hierarchy management.
* Advanced compensation planning.
* Notifications and email workflows.

These are important features for a real-world salary platform, but they would increase scope significantly. This version focuses on the core salary management and salary insight workflows first.

## Core Features

### 1. Employee Management

The HR Manager should be able to manage employees from the UI.

Each employee record should include:

* Full name
* Job title
* Department
* Country
* Currency
* Salary
* Employment type
* Hire date

The system should support:

* Adding a new employee
* Viewing a paginated list of employees
* Searching employees by name
* Filtering employees by country and job title
* Updating employee details
* Deleting an employee

Employee listing should be paginated so the UI does not try to load all 10,000 employees at once.

### 2. Salary Insights

The HR Manager should be able to view salary insights from the UI without manually calculating them.

The system should support:

* Minimum salary in a selected country
* Maximum salary in a selected country
* Average salary in a selected country
* Average salary for a selected job title in a selected country

Additional useful insights:

* Total employees in a selected country
* Total employees for a selected job title in a selected country
* Top countries by average salary
* Salary breakdown by job title within a country

These insights should be calculated from the database and should remain accurate when employee records are added, updated, or deleted.

### 3. Seed Data

The application should include a seed script that creates 10,000 employee records.

The seed script should:

* Generate full names by combining first names and last names from source files.
* Generate realistic job titles, countries, departments, currencies, salaries, employment types, and hire dates.
* Insert records efficiently using bulk operations.
* Be safe to run during development.
* Print a short summary after execution, including the number of employees created and time taken.

The seed script matters because engineers may run it regularly during development and testing.

### 4. Web UI

The UI should be simple and functional.

The application should have two main areas:

#### Employees

The Employees page should allow the HR Manager to:

* View employees in a table.
* Search employees by name.
* Filter employees by country and job title.
* Add a new employee.
* Edit an existing employee.
* Delete an employee.

#### Insights

The Insights page should allow the HR Manager to:

* Select a country.
* View minimum, maximum, and average salary for that country.
* Select a job title within the country.
* View the average salary for that job title in that country.
* View a small set of useful supporting metrics.

The UI should favor clarity over visual complexity.

## Functional Requirements

### Employee Records

* The system must allow creating an employee with all required fields.
* The system must validate required employee fields.
* Salary must be a positive number.
* Country and job title must be stored consistently enough to support filtering and reporting.
* The system must allow updating employee details.
* The system must allow deleting employee records.
* The system must support paginated employee listing.
* The system must support searching by employee name.
* The system must support filtering by country and job title.

### Salary Insights

* The system must calculate minimum salary for employees in a country.
* The system must calculate maximum salary for employees in a country.
* The system must calculate average salary for employees in a country.
* The system must calculate average salary for a job title in a country.
* The system must return clear empty states when no employees match a selected country or job title.
* Insights must reflect the latest employee data.

### Seed Script

* The system must include a script to seed 10,000 employees.
* The script must use first name and last name source files to generate full names.
* The script should use efficient database writes.
* The script should be documented in the README.

## Non-Functional Requirements

### Usability

The product should be usable by an HR Manager without needing technical knowledge. Common actions should be visible and simple.

### Performance

The application should remain responsive with 10,000 employees.

Expected behavior:

* Employee lists should use pagination.
* Salary insights should be calculated through database aggregation.
* Common filters should be backed by appropriate database indexes.
* The seed script should avoid slow row-by-row inserts where possible.

### Maintainability

The codebase should be organized so that future changes are easy to make.

Expected practices:

* Clear separation between API, business logic, database access, and UI.
* Small, readable functions.
* Meaningful names.
* Tests for core behavior.
* Simple architecture without unnecessary abstractions.

### Reliability

Core salary calculations should be covered by tests. The system should validate inputs and return useful error messages for invalid data.

### Developer Experience

A new developer should be able to run the project locally by following the README.

The repository should include:

* Setup instructions
* Environment variable examples
* Database setup instructions
* Seed script instructions
* Test instructions
* Brief architecture notes

## Success Criteria

This version is successful if:

* A developer can set up and run the application locally.
* The database can be seeded with 10,000 employees.
* The HR Manager can create, view, update, and delete employees from the UI.
* The HR Manager can search and filter employee records.
* The HR Manager can view salary insights by country and job title.
* Salary calculations are correct and covered by tests.
* The application remains usable with the seeded dataset.
* The project structure and documentation are clear enough for another engineer to understand.

## Initial Data Model

### Employee

Suggested fields:

* `id`
* `employee_code`
* `full_name`
* `job_title`
* `department`
* `country`
* `currency`
* `salary`
* `employment_type`
* `hire_date`
* `created_at`
* `updated_at`

### Indexing Considerations

The following fields are expected to be used often for filtering and reporting:

* `country`
* `job_title`
* `country + job_title`

Indexes on these fields should help salary insight queries remain fast as the dataset grows.

## Risks and Trade-offs

### Authentication Excluded

Authentication is not included in this version. In a real internal salary tool, authentication and access control would be required because salary data is sensitive. It is excluded here to keep the focus on the core product workflow, data model, tests, and salary insights.

### No Audit Log

Salary changes are not tracked historically in this version. A real system should record who changed salary data, when it changed, and what changed. This is excluded from the first version because it adds workflow and data-model complexity outside the core requirement.

### No Currency Conversion

Employees may belong to different countries and currencies. This version stores the employee salary with its currency but does not convert salaries across currencies. Cross-currency comparison can be misleading without exchange-rate rules, effective dates, and compensation policy decisions.

### Limited Analytics

The insights page focuses on simple salary metrics that are immediately useful to HR. More advanced analytics can be added later after the core workflows are stable.

## Future Improvements

Possible future improvements:

* Authentication and role-based access control
* Audit trail for employee and salary changes
* CSV or Excel import/export
* Salary change approval workflow
* Historical salary tracking
* Multi-currency conversion with exchange-rate snapshots
* Department-level insights
* Compensation bands by role and country
* Bulk employee updates
* Advanced dashboard charts
* Deployment hardening and monitoring

## Release Scope

The first release should include:

* Employee CRUD
* Employee search and filters
* Paginated employee table
* Country-level salary summary
* Country and job-title salary summary
* Seed script for 10,000 employees
* Backend tests for core behavior
* Clear README and developer setup
* Simple deployed demo
