const express = require('express');
const router = express.Router();

const Candidate = require('../models/candidate');
const User = require('../models/user');

const { jwtAuthMiddleware, generateToken } = require('../jwt');

const checkAdminRole = async (userId) => {
    try {
        const user = await User.findById(userId);
        if(user.role === 'admin'){
            return true;
        }
    } catch(err) {
        return false;
    }
}


// POST route to add a candidate
router.post('/',jwtAuthMiddleware, async (req, res) => {
    try {
        if(! (await checkAdminRole(req.user.id))) 
            return res.status(403).json({message: 'user does not have admin role.'});
        
        const data = req.body // Assume the request body contains the candidate data

        // Create a new user document using the mongoose model
        const newCandidate = new Candidate(data);

        // save the new user to the database
        const response = await newCandidate.save();
        console.log('data saved.');

        res.status(200).json({ response: response});
    }
    catch(err) {
        console.log(err);
        res.status(500).json({error: 'Internal server error.'});
    }
})




router.put('/:candidateID', jwtAuthMiddleware, async(req, res) => {
    try {
        if(!checkAdminRole(req.user.id)) 
            return res.status(403).json({message: 'user does not have admin role.'});

        const candidateID = req.params.candidateID; // Extract the id from the URL parameter
        const updatedCandidateData = req.body; // Updated data for the person

        const response = await Candidate.findByIdAndUpdate(candidateID, updatedCandidateData, {
            new: true, // Return the updated document
            runValidators: true, // Run Mongoose Validation
        })

        if(!response) {
            return res.status(404).json({error: 'Candidate Not Found.'});
        }
        
        console.log("Candidate Data Updated.");
        res.status(200).json(response);
    } catch(err) {
        console.log(err);
        res.status(500).json({error: 'Internal server error.'});
    }
})

router.delete('/:candidateID',jwtAuthMiddleware, async(req, res) => {
    try {
        if(!checkAdminRole(req.user.id)) 
            return res.status(403).json({message: 'user does not have  admin role.'});

        const candidateID = req.params.candidateID; // Extract the id from the URL parameter
   

        const response = await Candidate.findByIdAndDelete(candidateID);

        if(!response) {
            return res.status(404).json({error: 'Candidate Not Found.'});
        }
        
        console.log("Candidate Deleted.");
        res.status(200).json(response);
    } catch(err) {
        console.log(err);
        res.status(500).json({error: 'Internal server error.'});
    }
})


// let's start voting
router.post('/vote/:candidateID', jwtAuthMiddleware, async (req, res) => {
    // no admin can vote
    // user can only vote once

    candidateID = req.params.candidateID;
    userId = req.user.id;

    try {
        // Find the candidate document with the specified candidateID
        const candidate = await Candidate.findById(candidateID);
        if(!candidate) {
            return res.status(404).json({message: 'Candidate not found.'});
        }
        const user = await User.findById(userId);
        if(!user) {
            return res.status(404).json({message: 'User not found.'});
        }
        if(user.isVoted){
            res.status(400).json({message: 'Ypu are already voted.'});
        }
        if(user.role == 'admin'){
            res.status(403).json({message: 'Admin is not allowed.'});
        }

        // Update the candidate document to record the vote
        candidate.votes.push({user: userId})
        candidate.voteCount++;
        await candidate.save();

        // Update the user document
        user.isVoted = true
        await user.save();

        return res.status(200).json({message: 'Vote Recorded Successfully.'});
    } catch(err) {
        console.log(err);
        return res.status(500).json({error: 'Internal Server Error.'});
    }
});

// Vote Count
router.get('/vote/count', async (req, res) => {
    try {
        // Find all candidates and sort them by vote count by descending order
        const candidate = await Candidate.find().sort({voteCount: 'desc'});

        // Map the candidates to only return their name and  vote counts
        const voteRecord = candidate.map((data)=>{
            return {
                party: data.party,
                count: data.voteCount
            }
        });

        return res.status(200).json(voteRecord);

    } catch(err) {
        console.log(err);
        return res.status(500).json({error: 'Internal Server Error.'});
    }
})

// Get list of all candidates with only name and party fields
router.get('/candidateList', async (req, res) => {
    try {
        // Find all candidates and select only the name and party fields, excluding _id
        const candidates = await Candidate.find({}, 'name party - _id');

        // Return the list of candidates
        return res.status(200).json(candidates);
    } catch(err) {
        console.log(err);
        return res.status(500).json({error: 'Internal Server Error.'});
    }
})




module.exports = router;