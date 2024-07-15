const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/user');
const auth = require('./auth');

// Rejestracja użytkownika
router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    let user = await User.findOne({ username });
    if (user) {
      return res.status(400).json({ error: 'User already exists' });
    }

    user = new User({ username, password });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, 'your_jwt_secret', { expiresIn: 3600 });

    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Logowanie użytkownika
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    let user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ error: 'Invalid credentials' });
    }

    const payload = { user: { id: user.id } };
    const token = jwt.sign(payload, 'your_jwt_secret', { expiresIn: 3600 });
    // console.log(jwt.verify(payload, 'your_jwt_secret').foo)
    res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Wyszukiwanie użytkownika
router.get('/:id/user', auth, async (req, res) => {
  try {
    const user = await User.findOne({ username:  req.params.id }); 
    const payload = { user };
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Zwraca zawartosc portfela 
router.get('/:id/balance', auth, async (req, res) => {
  try {
    const user = await User.findOne({ username:  req.params.id });
    const payload = { user };
    res.status(200).json(payload);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

//Aktualizuje zawartosc portfela 
router.put('/:id/balance', async (req, res) => {
  const { amount, type, recever } = req.body; // amount to wartość, a type to typ operacji: 'deposit' lub 'withdraw'
  try {
    const account = await User.findOne({ username:  req.params.id });
    const transactionrecever = await User.findOne({ username:  recever });
    //const users = await User.findOne({ username:  name }); req.params.id
    if (!account || !transactionrecever) {
      return res.status(404).json({ error: 'Account not found' });
    }

    if (type === 'deposit') {
      account.balance += amount;
      //recever.balance -= amount;
    } else if (type === 'withdraw') {
      if (account.balance < amount) {
        return res.status(400).json({ error: 'Insufficient funds' });
      }
      account.balance -= amount;
      transactionrecever.balance += amount;
    } else {
      return res.status(400).json({ error: 'Invalid transaction type' });
    }

    console.log(transactionrecever.balance)
    await account.save();
    await transactionrecever.save();
    res.status(200).json(account);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
module.exports = router;