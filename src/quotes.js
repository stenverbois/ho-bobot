
function isUser(user, name) {
    if (name === "Arno") { return user.username === "Nintenrax" && user.discriminator === "3087"; }
    else if (name === "Tristan") { return user.username === "tristanvandeputte" && user.discriminator === "6353"; }
    else if (name === "Sten") { return user.username === "Mezzo" && user.discriminator === "9210"; }
    else if (name === "Beau") { return user.username === "Void" && user.discriminator === "2721"; }
    else if (name === "Mitchell") { return user.username === "SunlightHurtsMe" && user.discriminator === "2587"; }
    // Rest of ppls
}
function giveEntryQuoteFor(user){
    // Add pool of generic quotes with pool of name-specific quotes

    // TODO: quotes anders opslaan?
    let quotes = [`Holy shit it's ${user.name}`, `${user.name} Makes his appearance`]
    if (isUser(user, "Arno")) {
        quotes.push("A wild fag appeared");
    }
    else if (isUser(user, "Tristan")) {
        quotes.push("God has arrived");
    }
    else if (isUser(user, "Mitchell")) {
        quotes.push("RAGE INCOMING");
        quotes.push("This'll be a blast");
    }
    return quotes[Math.floor(Math.random()*quotes.length)];
}

function giveLeavingQuoteFor(user){
    // Add pool of generic quotes with pool of name-specific quotes

    // TODO: quotes anders opslaan?
    let quotes = [`Goodbye ${user.name}`, `${user.name} Will remain in our hearts`]

    if (isUser(user, "Arno")) {
        quotes.push("Good riddance");
    }
    else if (isUser(user, "Tristan")) {
        quotes.push(`We weep at your departure ${user.name}`);
    }
    return quotes[Math.floor(Math.random()*quotes.length)];
}

module.exports = {giveEntryQuoteFor,giveLeavingQuoteFor}
