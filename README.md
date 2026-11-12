# Northstar Management

An Angular management portal with admin, employee, and student workspaces. The app uses a local JSON Server API for demo data.

## Run locally

Install dependencies once:

```bash
npm install
```

Start the API and Angular app in separate terminals:

```bash
npm run server
```

```bash
npm start
```

Open `http://localhost:4200/`. JSON Server runs at `http://localhost:3000/`.

## Build

```bash
npm run build
```

## Demo accounts

| Role | Name | Password |
| --- | --- | --- |
| Admin | Admin User | Admin123 |
| Employee | Chandana | Employee123 |
| Student | Priya | Student123 |

The admin dashboard shows employee and student previews. Use the name search and the department/course selectors to filter those records. The full employee and student lists have their own search and filters; their selected department or course is also kept in the URL query string.

Registration asks students for a course and employees for a designation, then creates and links the corresponding profile record. Adding a student asks for only name, course, year, and assigned employee. Admins choose the employee; an employee-created student is automatically assigned to that employee. New employee and student profile IDs are numeric and increment from the current records. Students can edit their own phone number (digits only), address, and skills in their profile. An employee sees assigned students whose course matches the employee's designation; student profiles show the assigned employee, personal information, academic details, and skills.

## Project map

- `src/app/app.ts` and `app.html` are the root component. The existing root `RouterOutlet` is kept; routed application shells render there.
- `app.routes.ts` defines login, registration, the three role shells, lazy employee/student routes, resolver-backed profile routes, and the final not-found route. `app.config.ts` provides HttpClient, Router, and `PreloadAllModules`.
- `core/services` contains the authentication, employee, and student API services. Each HttpClient call returns an Observable; a request runs when the component subscribes. Components set loading state in `next`/`error` handlers.
- `core/guards` contains functional authentication and role guards. `core/resolvers` fetches profile records before their views render and prevents a student from requesting another student’s ID.
- `layout` contains separate admin, employee, and student shells, each with the shared header/sidebar and its own nested `RouterOutlet`.
- `features` contains the login/register pages, dashboards, and employee/student list, profile, and form components. The list pages apply search and filters to service-loaded data.
- `shared` contains the role-aware header/sidebar and the reusable action-buttons child. The parent passes its record ID with `@Input()` and handles the child’s `@Output()` events; the child makes no API calls.
- `models` defines the user, employee, and student data shapes. `db.json` provides demo data for JSON Server.

The employee service demonstrates GET, POST, PUT, and DELETE at `/employees`; the student service does the same at `/students`. Student records hold an `employeeId`, so one employee can have many students. Authentication reads `/users` for login and duplicate-email checks and POSTs registrations to `/users` with each account's profile ID.

## Security limits

This project uses demo authentication. JSON Server exposes all records, passwords in `db.json` are plaintext, and Angular route guards can be bypassed by changing browser state or calling the API directly. In a real application, a backend must hash passwords, control account/role creation, authenticate each request, authorize every operation, and restrict student profile data on the server. The browser-side student ID check is a learning example, not production access control.

## Tests

Run the tests:

```bash
npm test
```

If Vitest workers exceed available memory in Windows PowerShell, limit them and disable watch mode:

```powershell
$env:GOMAXPROCS = '2'
$env:VITEST_MAX_FORKS = '1'
npm test -- --watch=false
```

## Console messages

- **`NG0908: In this configuration Angular requires Zone.js`** means Zone.js was not loaded at startup. This project includes the `zone.js` dependency in the build polyfills in `angular.json`. The test target uses that development build. After pulling this fix, run `npm install` and restart `npm start`.
- **`Permissions policy violation: unload is not allowed`** and **`[pdf-viewer-detect] ... final: false`** do not appear to come from this app: its source has no unload handler or PDF viewer integration. They are commonly emitted by the browser or its host environment. If they remain in a regular browser tab, check with extensions disabled; they do not indicate that Angular failed to load.

For more on Angular's Zone.js setup, see the [Angular zoneless guide](https://angular.dev/guide/zoneless).
