# Class Hub

A simple website where students can check class information for **PA 106 (Citizenship and Governance)** and **PA 152** at UP NCPAG: announcements, deadlines, schedule, weekly readings, and how to reach the instructor.

- No logins, no student data, no tracking, no outside fonts or ads.
- Works on cheap phones, and has light and dark mode.
- All dates and "due in X days" countdowns use **Philippine time**.

**You never need to touch code.** Everything students see comes from two text files:

| Class  | File to edit                           |
|--------|----------------------------------------|
| PA 106 | [`content/pa106.md`](content/pa106.md) |
| PA 152 | [`content/pa152.md`](content/pa152.md) |

---

## How to edit a class file on github.com

1. Open the repository on github.com.
2. Click the **content** folder, then click the class file (for example `pa106.md`).
3. Click the **pencil icon** (✏️, "Edit this file") near the top right of the file.
4. Make your changes.
5. Click the green **Commit changes…** button, then **Commit changes** again. You can leave the message as it is.
6. Wait **1–2 minutes**, then reload the website. Your change is live.

> **Tip:** Text inside `{{ double curly braces }}` is a placeholder. Replace the whole thing, braces included. Until you do, it shows on the site in a dashed yellow box so you can see what's still missing.
>
> Text between `<!--` and `-->` is a note for you. Students never see it.

---

## How to post an announcement

1. Open the class file and click the pencil icon (see above).
2. Find the line `## Announcements`.
3. Below the note that ends with `-->`, add two lines like this:

   ```
   ### 2026-08-20 | No class on Friday
   Our Friday session is moved to Monday, same time and room. Please read **Chapter 2** before then.
   ```

   - The first line starts with `###`, then a space, then the **date** (year-month-day), a `|` bar, and the **title**.
   - The lines after it are the message. It can be as long as you like.
   - Leave a blank line between one announcement and the next.

4. Commit the change.

You can put a new announcement anywhere in the Announcements section. The site sorts them **newest first**, and anything posted in the last 7 days gets a green **New** label.

**To remove an announcement,** delete its lines and commit.

---

## How to add a deadline

1. Open the class file and click the pencil icon.
2. Find the line `## Deadlines`.
3. Below the note that ends with `-->`, add **one line** per deadline, starting with a dash:

   ```
   - 2026-09-10 | Reaction paper 1 | Submit on UVLe
   ```

   The order is: **date | what is due | extra details**. The extra details are optional.

   More examples:

   ```
   - 2026-10-02 11:59 PM | Policy brief draft
   - Sep 25, 2026 | Group presentation | Slides due before class
   - TBA | Final paper | Date to be announced in class
   ```

4. Commit the change.

The site automatically:

- sorts deadlines from soonest to latest,
- shows **Due today**, **Due tomorrow**, or **Due in X days**, colored red when it's 0–1 days away, amber within a week, and green after that,
- moves past deadlines into a folded **Past deadlines** list, so you don't need to delete them.

A deadline with no time is treated as due at the end of that day.

---

## Other things you might want to change

**Course details at the top** (`## Class info`): one `Label: value` per line. You can add lines such as `Room: ...`. `Summary:` is the short sentence on the home page card.

**Schedule and Contact:** these are ordinary bullet lists. Lines like `- Room: GT Toyota 201` show the part before the colon in bold.

**Weekly topics and readings:** each week starts with a `###` line, and readings go underneath with dashes:

```
### Week 3 | Sep 1–5 | Citizenship in the Philippine Constitution
- [Author (Year). Title of the reading](https://link-to-the-reading)
- Author (Year). A reading without a link
```

**Links** anywhere: `[words students see](https://the-full-link)`. Plain web addresses and email addresses also become clickable automatically.

**Uploading a PDF (such as a syllabus):** open the `files` folder, choose **Add file → Upload files**, then link to it as `[Syllabus](files/syllabus.pdf)`. Only upload things that are fine for anyone with the link to see. This site is public.

**Adding a whole new section** (for example Grading): add a line like `## Grading system` and write under it. It shows up on the page and in the menu at the top.

**Order of sections:** sections appear on the page in the same order as in the file. Move a whole section (from its `##` line down to the next `##` line) to reorder it.

**Formatting:** `**bold**`, `*italics*`, `- ` for bullet lists, `1. ` for numbered lists. Leave a blank line between paragraphs.

---

## If something looks wrong

- **My change isn't showing.** Wait 2 minutes and reload. On phones, pull down to refresh. You can check progress in the repository's **Actions** tab, where a green check means the change is live.
- **An announcement says "Undated".** Its date wasn't recognized. Use `2026-08-20` or `Aug 20, 2026`, with a `|` before the title.
- **Something disappeared.** Check that it isn't inside a `<!--` … `-->` note, and that the section's `##` title still contains the word "Announcements" or "Deadlines".
- **I broke it.** Open the file, click **History**, and you can see and copy any earlier version.

---

## One-time setup: turning on the website (GitHub Pages)

1. In the repository, go to **Settings → Pages**.
2. Under **Build and deployment**, set **Source** to *Deploy from a branch*.
3. Choose the branch **main** and the folder **/ (root)**, then click **Save**.
4. After a minute or two the address appears at the top of that page, usually `https://<your-username>.github.io/class-hub/`. Share that link with your students.

---

## For the technically curious

Plain HTML, CSS and JavaScript with no build step and no libraries.

- `index.html`: home page with a card per class
- `class.html?c=pa106`: class page, filled from the class file
- `assets/app.js`: reads the text files and builds the pages. The class list is at the top of this file if you ever add a third class.
- `assets/style.css`: design, including light and dark mode
- `.nojekyll`: tells GitHub Pages to serve the `.md` files as plain text

To preview on your own computer, run `python3 -m http.server` in this folder and open `http://localhost:8000`. Opening the HTML file directly won't load the content.
