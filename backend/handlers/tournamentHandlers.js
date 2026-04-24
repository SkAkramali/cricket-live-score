const crypto = require('crypto');
const Tournament = require('../models/Tournament');

exports.createTournament = async (req, res, next) => {
  try {
    const join_code = crypto.randomBytes(4).toString('hex').toUpperCase();
    const data = { ...req.body, created_by: req.user.user_id, join_code };
    const tournament = await Tournament.create(data);
    res.status(201).json({ success: true, data: tournament });
  } catch (error) {
    next(error);
  }
};

exports.joinTournament = async (req, res, next) => {
  try {
    const { join_code } = req.body;
    if (!join_code) return res.status(400).json({ success: false, message: 'Join code is required' });
    const tournament = await Tournament.findByJoinCode(join_code);
    if (!tournament) return res.status(404).json({ success: false, message: 'Invalid join code. Tournament not found.' });
    res.status(200).json({ success: true, data: tournament });
  } catch (error) {
    next(error);
  }
};

exports.getTournaments = async (req, res, next) => {
  try {
    const filters = req.query;
    const tournaments = await Tournament.findAll(filters);
    res.status(200).json({ success: true, data: tournaments });
  } catch (error) {
    next(error);
  }
};

exports.getTournamentById = async (req, res, next) => {
  try {
    const tournament = await Tournament.findById(req.params.id);
    if (!tournament) return res.status(404).json({ success: false, message: 'Tournament not found' });
    res.status(200).json({ success: true, data: tournament });
  } catch (error) {
    next(error);
  }
};

exports.updateTournament = async (req, res, next) => {
  try {
    const tournament = await Tournament.update(req.params.id, req.body);
    res.status(200).json({ success: true, data: tournament });
  } catch (error) {
    next(error);
  }
};

exports.deleteTournament = async (req, res, next) => {
  try {
    await Tournament.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Tournament deleted' });
  } catch (error) {
    next(error);
  }
};
