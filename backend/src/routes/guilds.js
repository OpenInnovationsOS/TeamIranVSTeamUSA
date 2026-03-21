const express = require('express');
const router = express.Router();
const Guild = require('../models/Guild');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { broadcastToUser, broadcastToAll } = require('../websocket/server');

// Get all guilds
router.get('/', async (req, res) => {
  try {
    const { faction, type, search, limit = 20, page = 1 } = req.query;
    
    let guilds;
    
    if (search) {
      guilds = await Guild.searchGuilds(search, faction);
    } else if (faction) {
      guilds = await Guild.findByFaction(faction);
    } else {
      guilds = await Guild.findPublicGuilds(parseInt(limit));
    }
    
    // Populate leader info
    guilds = await Guild.populate(guilds, {
      path: 'leader',
      select: 'username telegram_id faction level'
    });
    
    res.json({
      success: true,
      data: {
        guilds: guilds.map(guild => ({
          id: guild._id,
          guild_id: guild.guild_id,
          name: guild.name,
          tag: guild.tag,
          description: guild.description,
          faction: guild.faction,
          type: guild.type,
          member_count: guild.memberCount,
          max_members: guild.membership.max_members,
          power_level: guild.resources.power_level,
          leader: guild.leader,
          stats: guild.stats,
          requirements: {
            min_level: guild.membership.min_level,
            require_approval: guild.membership.require_approval
          },
          can_join: guild.canJoin
        })),
        pagination: {
          current_page: page,
          total_items: guilds.length
        }
      }
    });
  } catch (error) {
    console.error('Error fetching guilds:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch guilds' }
    });
  }
});

// Get guild by ID
router.get('/:id', async (req, res) => {
  try {
    const guild = await Guild.findById(req.params.id)
      .populate('leader', 'username telegram_id faction level avatar_url')
      .populate('officers', 'username telegram_id faction level avatar_url')
      .populate('members.user_id', 'username telegram_id faction level avatar_url');
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        error: { message: 'Guild not found' }
      });
    }
    
    res.json({
      success: true,
      data: guild
    });
  } catch (error) {
    console.error('Error fetching guild:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch guild' }
    });
  }
});

// Create new guild
router.post('/', auth, async (req, res) => {
  try {
    const {
      name,
      tag,
      description,
      faction,
      type = 'public',
      membership_settings = {}
    } = req.body;
    
    const user = await User.findById(req.user.id);
    
    // Check if user is already in a guild
    if (user.guild_id) {
      return res.status(400).json({
        success: false,
        error: { message: 'Already in a guild' }
      });
    }
    
    // Check if user meets level requirement
    const minLevelForCreation = 10;
    if (user.level < minLevelForCreation) {
      return res.status(400).json({
        success: false,
        error: { message: `Level ${minLevelForCreation} required to create a guild` }
      });
    }
    
    // Check if name is taken
    const existingGuild = await Guild.findOne({ name: name.trim() });
    if (existingGuild) {
      return res.status(400).json({
        success: false,
        error: { message: 'Guild name already taken' }
      });
    }
    
    // Check if tag is taken
    if (tag) {
      const existingTag = await Guild.findOne({ tag: tag.toUpperCase().trim() });
      if (existingTag) {
        return res.status(400).json({
          success: false,
          error: { message: 'Guild tag already taken' }
        });
      }
    }
    
    // Generate unique guild ID
    const guild_id = `guild_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Create guild
    const guild = new Guild({
      guild_id,
      name: name.trim(),
      tag: tag ? tag.toUpperCase().trim() : undefined,
      description: description?.trim(),
      faction,
      type,
      leader: user._id,
      officers: [],
      membership: {
        min_level: membership_settings.min_level || 1,
        max_members: membership_settings.max_members || 50,
        auto_accept: membership_settings.auto_accept || false,
        require_approval: membership_settings.require_approval !== false,
        application_question: membership_settings.application_question
      }
    });
    
    // Add creator as leader
    await guild.addMember(user, 'leader');
    
    // Update user's guild
    user.guild_id = guild._id;
    user.guild_rank = 'leader';
    await user.save();
    
    // Broadcast new guild
    broadcastToAll({
      type: 'guild_created',
      guild: {
        id: guild._id,
        guild_id: guild.guild_id,
        name: guild.name,
        tag: guild.tag,
        faction: guild.faction,
        leader: {
          id: user._id,
          username: user.username,
          faction: user.faction
        }
      },
      timestamp: new Date().toISOString()
    });
    
    res.status(201).json({
      success: true,
      message: 'Guild created successfully',
      data: guild
    });
  } catch (error) {
    console.error('Error creating guild:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to create guild' }
    });
  }
});

// Join guild
router.post('/:id/join', auth, async (req, res) => {
  try {
    const { application_answer } = req.body;
    
    const guild = await Guild.findById(req.params.id);
    const user = await User.findById(req.user.id);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        error: { message: 'Guild not found' }
      });
    }
    
    // Check if user is already in a guild
    if (user.guild_id) {
      return res.status(400).json({
        success: false,
        error: { message: 'Already in a guild' }
      });
    }
    
    // Check if user meets requirements
    if (user.level < guild.membership.min_level) {
      return res.status(400).json({
        success: false,
        error: { message: `Level requirement: ${guild.membership.min_level}` }
      });
    }
    
    // Check faction requirements
    if (guild.faction !== 'neutral' && user.faction !== guild.faction) {
      return res.status(400).json({
        success: false,
        error: { message: `Faction requirement: ${guild.faction}` }
      });
    }
    
    // Check if guild is full
    if (guild.isFull) {
      return res.status(400).json({
        success: false,
        error: { message: 'Guild is full' }
      });
    }
    
    // Handle different join types
    if (guild.type === 'public' && guild.membership.auto_accept) {
      // Auto-accept for public guilds with auto-accept enabled
      await guild.addMember(user, 'member');
      
      // Update user's guild
      user.guild_id = guild._id;
      user.guild_rank = 'member';
      await user.save();
      
      // Notify guild members
      guild.members.forEach(member => {
        if (member.user_id.toString() !== user._id.toString()) {
          broadcastToUser(member.user_id.toString(), {
            type: 'guild_member_joined',
            guild_id: guild._id,
            member: {
              id: user._id,
              username: user.username,
              faction: user.faction,
              level: user.level
            },
            timestamp: new Date().toISOString()
          });
        }
      });
      
      res.json({
        success: true,
        message: 'Joined guild successfully',
        data: {
          guild_id: guild._id,
          rank: 'member'
        }
      });
    } else {
      // Create join request (for private guilds or those requiring approval)
      // This would typically be stored in a separate JoinRequest model
      res.json({
        success: true,
        message: 'Join request submitted',
        data: {
          status: 'pending_approval',
          guild_id: guild._id
        }
      });
    }
  } catch (error) {
    console.error('Error joining guild:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to join guild' }
    });
  }
});

// Leave guild
router.post('/:id/leave', auth, async (req, res) => {
  try {
    const guild = await Guild.findById(req.params.id);
    const user = await User.findById(req.user.id);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        error: { message: 'Guild not found' }
      });
    }
    
    // Check if user is a member
    const member = guild.members.find(m => 
      m.user_id.toString() === user._id.toString()
    );
    
    if (!member) {
      return res.status(404).json({
        success: false,
        error: { message: 'Not a member of this guild' }
      });
    }
    
    // Leaders cannot leave, they must transfer leadership first
    if (member.rank === 'leader') {
      return res.status(400).json({
        success: false,
        error: { message: 'Leader cannot leave guild. Transfer leadership first.' }
      });
    }
    
    // Remove member from guild
    await guild.removeMember(user._id);
    
    // Update user's guild
    user.guild_id = null;
    user.guild_rank = null;
    await user.save();
    
    // Notify guild members
    guild.members.forEach(remainingMember => {
      broadcastToUser(remainingMember.user_id.toString(), {
        type: 'guild_member_left',
        guild_id: guild._id,
        member: {
          id: user._id,
          username: user.username,
          faction: user.faction
        },
        timestamp: new Date().toISOString()
      });
    });
    
    res.json({
      success: true,
      message: 'Left guild successfully'
    });
  } catch (error) {
    console.error('Error leaving guild:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to leave guild' }
    });
  }
});

// Get guild members
router.get('/:id/members', async (req, res) => {
  try {
    const guild = await Guild.findById(req.params.id)
      .populate('members.user_id', 'username telegram_id faction level avatar_url last_active')
      .populate('leader', 'username telegram_id faction level avatar_url')
      .populate('officers', 'username telegram_id faction level avatar_url');
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        error: { message: 'Guild not found' }
      });
    }
    
    // Sort members by rank and level
    const sortedMembers = guild.members.sort((a, b) => {
      const rankOrder = { leader: 4, officer: 3, veteran: 2, member: 1, recruit: 0 };
      if (rankOrder[b.rank] !== rankOrder[a.rank]) {
        return rankOrder[b.rank] - rankOrder[a.rank];
      }
      return b.level - a.level;
    });
    
    res.json({
      success: true,
      data: {
        guild_id: guild._id,
        guild_name: guild.name,
        leader: guild.leader,
        officers: guild.officers,
        members: sortedMembers,
        total_members: guild.memberCount,
        max_members: guild.membership.max_members
      }
    });
  } catch (error) {
    console.error('Error fetching guild members:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch guild members' }
    });
  }
});

// Promote guild member
router.post('/:id/promote/:memberId', auth, async (req, res) => {
  try {
    const { new_rank } = req.body;
    
    const guild = await Guild.findById(req.params.id);
    const user = await User.findById(req.user.id);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        error: { message: 'Guild not found' }
      });
    }
    
    // Check if user has permission to promote
    const callerMember = guild.members.find(m => 
      m.user_id.toString() === user._id.toString()
    );
    
    if (!callerMember || !callerMember.permissions.can_promote) {
      return res.status(403).json({
        success: false,
        error: { message: 'Insufficient permissions to promote members' }
      });
    }
    
    // Promote member
    await guild.promoteMember(req.params.memberId, new_rank);
    
    // Update promoted user's guild rank
    const promotedUser = await User.findById(req.params.memberId);
    if (promotedUser) {
      promotedUser.guild_rank = new_rank;
      await promotedUser.save();
    }
    
    // Get updated guild
    const updatedGuild = await Guild.findById(req.params.id)
      .populate('members.user_id', 'username telegram_id faction level');
    
    const promotedMember = updatedGuild.members.find(m => 
      m.user_id.toString() === req.params.memberId
    );
    
    // Notify guild members
    guild.members.forEach(member => {
      broadcastToUser(member.user_id.toString(), {
        type: 'guild_member_promoted',
        guild_id: guild._id,
        promoted_member: {
          id: promotedMember.user_id._id,
          username: promotedMember.user_id.username,
          old_rank: promotedMember.rank,
          new_rank: new_rank
        },
        promoted_by: {
          id: user._id,
          username: user.username
        },
        timestamp: new Date().toISOString()
      });
    });
    
    res.json({
      success: true,
      message: 'Member promoted successfully',
      data: promotedMember
    });
  } catch (error) {
    console.error('Error promoting guild member:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to promote member' }
    });
  }
});

// Kick guild member
router.post('/:id/kick/:memberId', auth, async (req, res) => {
  try {
    const guild = await Guild.findById(req.params.id);
    const user = await User.findById(req.user.id);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        error: { message: 'Guild not found' }
      });
    }
    
    // Check if user has permission to kick
    const callerMember = guild.members.find(m => 
      m.user_id.toString() === user._id.toString()
    );
    
    if (!callerMember || !callerMember.permissions.can_kick) {
      return res.status(403).json({
        success: false,
        error: { message: 'Insufficient permissions to kick members' }
      });
    }
    
    // Get member to be kicked
    const memberToKick = guild.members.find(m => 
      m.user_id.toString() === req.params.memberId
    );
    
    if (!memberToKick) {
      return res.status(404).json({
        success: false,
        error: { message: 'Member not found' }
      });
    }
    
    // Cannot kick leader
    if (memberToKick.rank === 'leader') {
      return res.status(400).json({
        success: false,
        error: { message: 'Cannot kick guild leader' }
      });
    }
    
    // Remove member from guild
    await guild.removeMember(req.params.memberId);
    
    // Update kicked user's guild
    const kickedUser = await User.findById(req.params.memberId);
    if (kickedUser) {
      kickedUser.guild_id = null;
      kickedUser.guild_rank = null;
      await kickedUser.save();
    }
    
    // Notify guild members
    guild.members.forEach(remainingMember => {
      broadcastToUser(remainingMember.user_id.toString(), {
        type: 'guild_member_kicked',
        guild_id: guild._id,
        kicked_member: {
          id: memberToKick.user_id,
          username: memberToKick.user_id.username,
          faction: memberToKick.faction
        },
        kicked_by: {
          id: user._id,
          username: user.username
        },
        timestamp: new Date().toISOString()
      });
    });
    
    res.json({
      success: true,
      message: 'Member kicked successfully'
    });
  } catch (error) {
    console.error('Error kicking guild member:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to kick member' }
    });
  }
});

// Contribute to guild
router.post('/:id/contribute', auth, async (req, res) => {
  try {
    const { amount, type = 'stg' } = req.body;
    
    const guild = await Guild.findById(req.params.id);
    const user = await User.findById(req.user.id);
    
    if (!guild) {
      return res.status(404).json({
        success: false,
        error: { message: 'Guild not found' }
      });
    }
    
    // Check if user is a member
    const member = guild.members.find(m => 
      m.user_id.toString() === user._id.toString()
    );
    
    if (!member) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not a member of this guild' }
      });
    }
    
    // Check user's balance
    if (type === 'stg' && user.stg_balance < amount) {
      return res.status(400).json({
        success: false,
        error: { message: 'Insufficient STG balance' }
      });
    }
    
    // Deduct from user and contribute to guild
    if (type === 'stg') {
      user.stg_balance -= amount;
      await user.save();
    }
    
    await guild.contributeResources(user._id, amount, type);
    
    // Notify guild members
    guild.members.forEach(guildMember => {
      broadcastToUser(guildMember.user_id.toString(), {
        type: 'guild_contribution',
        guild_id: guild._id,
        contribution: {
          user_id: user._id,
          username: user.username,
          amount: amount,
          type: type,
          new_treasury: guild.resources.stg_treasury
        },
        timestamp: new Date().toISOString()
      });
    });
    
    res.json({
      success: true,
      message: 'Contribution successful',
      data: {
        amount: amount,
        type: type,
        new_treasury: guild.resources.stg_treasury,
        your_contribution: member.contribution.stg_contributed
      }
    });
  } catch (error) {
    console.error('Error contributing to guild:', error);
    res.status(500).json({
      success: false,
      error: { message: error.message || 'Failed to contribute' }
    });
  }
});

// Get top guilds leaderboard
router.get('/leaderboard/top', async (req, res) => {
  try {
    const { faction, limit = 10 } = req.query;
    
    const topGuilds = await Guild.getTopGuilds(parseInt(limit), faction);
    
    // Populate leader info
    const populatedGuilds = await Guild.populate(topGuilds, {
      path: 'leader',
      select: 'username telegram_id faction level'
    });
    
    res.json({
      success: true,
      data: {
        guilds: populatedGuilds.map((guild, index) => ({
          rank: index + 1,
          id: guild._id,
          guild_id: guild.guild_id,
          name: guild.name,
          tag: guild.tag,
          faction: guild.faction,
          leader: guild.leader,
          member_count: guild.memberCount,
          power_level: guild.resources.power_level,
          stats: guild.stats,
          resources: guild.resources
        }))
      }
    });
  } catch (error) {
    console.error('Error fetching guild leaderboard:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch guild leaderboard' }
    });
  }
});

module.exports = router;
