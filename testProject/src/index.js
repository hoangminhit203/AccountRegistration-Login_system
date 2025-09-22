// ...existing code...

// Middleware: check login
function requireLogin(req, res, next) {
  if (req.session && req.session.user) {
    return next()
  }
  res.redirect(
    "/?error=" + encodeURIComponent("Please login to access dashboard.")
  )
}
// ...existing code...
const express = require("express")
const path = require("path")
const bcrypt = require("bcrypt")
const collection = require("./config")
const crypto = require("crypto")
const nodemailer = require("nodemailer")
const rateLimit = require("express-rate-limit")
const session = require("express-session")

const app = express()

// Simple session (for demo, not production secure)
app.use(
  session({
    secret: "secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 60 * 60 * 1000 },
  })
)

// Middleware
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

// View engine
app.set("view engine", "ejs")
app.set("views", path.join(__dirname, "..", "views"))

// Static files
app.use(express.static(path.join(__dirname, "..", "public")))

// Configure nodemailer (use your real email credentials)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "truongminhtri1507@gmail.com", // <-- put your real Gmail address here
    pass: "owug qisw lvlp wzed", // <-- put your Gmail app password here
  },
})

// Rate limiter: 3 requests per 5 minutes per IP
const authLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 3,
  message: "Too many requests from this IP, please try again after 5 minutes.",
})

// Apply rate limiter to signup and login
app.post("/signup", authLimiter)
app.post("/login", authLimiter)

// Routes
app.get("/", (req, res) => {
  const error = req.query.error || null
  res.render("login", { error })
})

app.get("/signup", (req, res) => {
  res.render("signup", { error: null })
})

// Helper: send email with retry
async function sendMailWithRetry(mailOptions, maxRetries = 3, delayMs = 2000) {
  let attempt = 0
  while (attempt < maxRetries) {
    try {
      await transporter.sendMail(mailOptions)
      return true
    } catch (err) {
      attempt++
      if (attempt >= maxRetries) throw err
      await new Promise((res) => setTimeout(res, delayMs))
    }
  }
}

// Register user
app.post("/signup", async (req, res) => {
  console.log("Signup request received:", req.body)

  const activationToken = crypto.randomBytes(32).toString("hex")
  const data = {
    firstName: req.body.firstName,
    lastName: req.body.lastName,
    email: req.body.email,
    password: req.body.password,
    active: false, // Account is inactive by default
    activationToken,
  }

  console.log("Processed data:", data)

  const existingUser = await collection.findOne({ email: data.email })
  if (existingUser) {
    return res.render("signup", { error: "User already exists!" })
  }

  const saltRounds = 10
  const hashedPassword = await bcrypt.hash(data.password, saltRounds)

  data.password = hashedPassword

  try {
    const user = await collection.create(data)
    // Send activation email with retry
    const activationUrl = `http://localhost:5000/activate/${activationToken}`
    const mailOptions = {
      from: "no-reply@example.com",
      to: data.email,
      subject: "Confirm your email address",
      html: `
        <div style="max-width:480px;margin:40px auto;padding:32px 24px 24px 24px;background:#f9fbfc;border-radius:12px;box-shadow:0 2px 16px rgba(0,0,0,0.07);font-family:sans-serif;text-align:center;">
          <img src="https://cdn-icons-png.flaticon.com/512/561/561127.png" alt="mail" width="56" style="margin-bottom:18px;opacity:0.85;"/>
          <h2 style="color:#222;font-size:1.5em;margin-bottom:14px;font-weight:700;">You're almost there!<br>Just confirm your email</h2>
          <p style="color:#444;margin-bottom:28px;font-size:1.08em;">You've successfully created a new account.<br>To activate it, please click the button below to verify your email address.</p>
          <a href="${activationUrl}" style="display:inline-block;padding:13px 36px;background:linear-gradient(90deg,#2bbecb,#3a8dde);color:#fff;text-decoration:none;font-weight:600;border-radius:7px;font-size:1.13em;margin-bottom:28px;box-shadow:0 2px 8px rgba(42,190,203,0.13);transition:background 0.2s;">Activate Your Account</a>
          <p style="color:#888;font-size:1em;margin-top:36px;">Best regards,<br><span style="color:#2bbecb;font-weight:600;">Your Team</span></p>
        </div>
      `,
    }
    try {
      await sendMailWithRetry(mailOptions, 3, 2000)
      res.render("confirm-email", {
        email: data.email,
      })
    } catch (emailErr) {
      console.error("Email sending failed after retries:", emailErr)
      res.render("confirm-email", {
        email: data.email,
      })
    }
  } catch (err) {
    console.error("Registration error:", err)
    res.status(500).send("Error registering user.")
  }
})

// Resend activation email
app.post("/resend-email", async (req, res) => {
  const email = req.body.email
  const user = await collection.findOne({ email })
  if (!user) {
    return res.render("confirm-email", { email, error: "User not found." })
  }
  if (user.active) {
    return res.render("confirm-email", {
      email,
      error: "Account already activated.",
    })
  }
  // Nếu chưa có activationToken thì tạo mới
  if (!user.activationToken) {
    user.activationToken = crypto.randomBytes(32).toString("hex")
    await user.save()
  }
  const activationUrl = `http://localhost:5000/activate/${user.activationToken}`
  const mailOptions = {
    from: "no-reply@example.com",
    to: email,
    subject: "Confirm your email address",
    html: `
      <div style="max-width:480px;margin:40px auto;padding:32px 24px;background:#fff;border-radius:10px;box-shadow:0 2px 16px rgba(0,0,0,0.07);font-family:sans-serif;text-align:center;">
        <h2 style="color:#222;font-size:1.6em;margin-bottom:16px;">You're almost there! Just confirm your email</h2>
        <p style="color:#444;margin-bottom:24px;">You've successfully created a new account. To activate it, please click below to verify your email address.</p>
        <a href="${activationUrl}" style="display:inline-block;padding:12px 32px;background:#2bbecb;color:#fff;text-decoration:none;font-weight:600;border-radius:6px;font-size:1.1em;margin-bottom:24px;">Activate Your Account</a>
        <p style="color:#888;font-size:0.97em;margin-top:32px;">Cheers,<br>The Team</p>
      </div>
    `,
  }
  try {
    await sendMailWithRetry(mailOptions, 3, 2000)
    res.render("confirm-email", { email, error: null })
  } catch (err) {
    console.error("Resend email failed:", err)
    res.render("confirm-email", {
      email,
      error: "Failed to resend email. Please try again later.",
    })
  }
})

// Account activation route
app.get("/activate/:token", async (req, res) => {
  const token = req.params.token
  const user = await collection.findOne({ activationToken: token })
  if (!user) {
    return res.send("Invalid or expired activation link.")
  }
  user.active = true
  user.activationToken = null
  await user.save()
  res.render("activation-success")
})

// Login
app.post("/login", async (req, res) => {
  try {
    const check = await collection.findOne({ email: req.body.email })

    if (!check) {
      return res.redirect(
        "/?error=" + encodeURIComponent("Your account cannot be found.")
      )
    }

    if (!check.active) {
      return res.redirect(
        "/?error=" +
          encodeURIComponent(
            "Your account is not activated. Please check your email to activate your account."
          )
      )
    }

    const isPasswordMatch = await bcrypt.compare(
      req.body.password,
      check.password
    )

    if (isPasswordMatch) {
      req.session.user = {
        email: check.email,
        firstName: check.firstName,
        lastName: check.lastName,
      }
      return res.render("home", { user: req.session.user })
    } else {
      return res.redirect("/?error=" + encodeURIComponent("Wrong password."))
    }
    // Dashboard route (protected)
    app.get("/dashboard", requireLogin, (req, res) => {
      res.render("dashboard", { user: req.session.user })
    })

    // Logout route
    app.get("/logout", (req, res) => {
      req.session.destroy(() => {
        res.redirect("/")
      })
    })
  } catch (err) {
    console.error(err)
    res.status(500).send("Something went wrong.")
  }
})

const port = 5000
app.listen(port, () => {
  console.log(`Server is running on port: ${port}`)
})
