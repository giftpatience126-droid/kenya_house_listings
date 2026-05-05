export function getChatbotReply(message, listings) {
  const input = message.trim().toLowerCase();

  if (!input) {
    return {
      reply: "Tell me your budget, category, or preferred location and I will suggest a few strong options.",
      suggestions: listings.slice(0, 3)
    };
  }

  const categoryKeywords = ["home", "airbnb", "hotel", "restaurant"];
  const matchedCategory = categoryKeywords.find((keyword) => input.includes(keyword));
  const budget = extractBudget(input);
  const locationMatches = listings.filter((listing) => input.includes(listing.location.toLowerCase()));

  const scored = listings
    .map((listing) => {
      let score = 0;
      const listingPrice = normalizePrice(listing.price);

      if (matchedCategory && listing.category === matchedCategory) {
        score += 4;
      }

      if (input.includes(listing.location.toLowerCase())) {
        score += 4;
      }

      if (input.includes(listing.title.toLowerCase())) {
        score += 3;
      }

      if (budget && listingPrice <= budget) {
        score += 3;
      }

      if (budget && listingPrice > 0) {
        score += Math.max(0, 2 - Math.abs(budget - listingPrice) / Math.max(budget, 1));
      }

      return { listing, score };
    })
    .sort((left, right) => right.score - left.score)
    .filter((entry) => entry.score > 0)
    .slice(0, 3)
    .map((entry) => entry.listing);

  const suggestions = scored.length > 0 ? scored : listings.slice(0, 3);

  if (locationMatches.length > 0) {
    return {
      reply: `I found a few options around ${locationMatches[0].location}. You can also filter by category if you want a tighter shortlist.`,
      suggestions
    };
  }

  if (matchedCategory) {
    return {
      reply: `Here are some ${matchedCategory} options that best match your request.`,
      suggestions
    };
  }

  if (budget) {
    return {
      reply: `I looked for places close to your budget of Ksh ${budget.toLocaleString()}. These are the strongest matches.`,
      suggestions
    };
  }

  return {
    reply: "These are a few strong suggestions based on your message. Try adding a location, category, or budget for sharper matches.",
    suggestions
  };
}

function extractBudget(input) {
  const match = input.match(/(\d[\d,]*)/);
  if (!match) {
    return 0;
  }

  return Number(match[1].replace(/,/g, ""));
}

function normalizePrice(priceLabel) {
  const numeric = Number(String(priceLabel).replace(/[^\d.]/g, ""));
  return Number.isFinite(numeric) ? numeric : 0;
}
