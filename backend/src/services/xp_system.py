RANKS = [
    {"name": "Szumofon", "min_xp": 0},
    {"name": "Koneser Bitów", "min_xp": 500},
    {"name": "DJ Winamp", "min_xp": 1500},
    {"name": "Kierownik Imprezy", "min_xp": 5000},
    {"name": "Dyrektor Programowy", "min_xp": 10000},
]

def get_rank(xp: int) -> dict:
    current_rank = RANKS[0]
    next_rank = None
    
    for i, rank in enumerate(RANKS):
        if xp >= rank["min_xp"]:
            current_rank = rank
            if i + 1 < len(RANKS):
                next_rank = RANKS[i + 1]
        else:
            if next_rank is None:
                next_rank = rank
            break
    
    current_xp = xp - current_rank["min_xp"]
    if next_rank:
        needed_xp = next_rank["min_xp"] - current_rank["min_xp"]
        progress = min(100, int((current_xp / needed_xp) * 100)) if needed_xp > 0 else 100
    else:
        needed_xp = 0
        progress = 100
    
    return {
        "name": current_rank["name"],
        "xp": xp,
        "current_xp": current_xp,
        "next_rank": next_rank["name"] if next_rank else None,
        "next_rank_xp": next_rank["min_xp"] if next_rank else None,
        "needed_xp": needed_xp,
        "progress": progress,
    }

XP_PER_VOTE = 10
XP_PER_MINUTE_LISTENING = 1

