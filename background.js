const truncateTitle = (title) => {
  return title
    .replace("(4K UHD)", "")
    .split(" Season ")[0]
    .replace(/ -|,|\[|\]|\(|\)/g, "")
    .trim()
    .replace(/ /g, "+")
    .replace(":+The+Complete+First+Season", "")
    .replace(/\//g, "");
};

const createRatingLabel = (rating, currentResult) => {
  const label = document.createElement("SPAN");
  label.setAttribute("class", "imdb-rating");
  const textnode = document.createTextNode(rating);
  label.appendChild(textnode);
  currentResult.insertBefore(label, currentResult.childNodes[0]);
};

const addOMDbRatingToFirestore = async (firebaseDocId, data) => {
  let media = db.collection("media");
  if (data !== undefined) {
    try {
      media.doc(firebaseDocId).set({
        Title: data.Title,
        Year: data.Year,
        imdbID: data.imdbID,
        imdbRating: data.imdbRating,
        imdbVotes: data.imdbVotes,
      });
    } catch (error) {
      console.error("Error writing document: ", error);
    }
  } else {
    try {
      media.doc(firebaseDocId).set({
        Title: "",
        Year: "",
        imdbID: "",
        imdbRating: "",
        imdbVotes: "",
      });
    } catch (error) {
      console.error("Error writing document: ", error);
    }
  }
};

const addAmazonRatingToFirestore = async (firebaseDocId, amazonRating) => {
  let media = db.collection("media");
  try {
    media.doc(firebaseDocId).set({
      imdbRating: amazonRating,
    });
  } catch (error) {
    console.error("Error writing document: ", error);
  }
};

const checkOMDbAndCreateLabel = async (
  firebaseDocId,
  truncatedTitle,
  currentResult
) => {
  try {
    let response = await fetch(
      `https://www.omdbapi.com/?t=${truncatedTitle}&apikey=c04db74d`
    );
    let data = await response.json();
    if (typeof data.imdbRating !== "undefined") {
      createRatingLabel(data.imdbRating, currentResult);
      addOMDbRatingToFirestore(firebaseDocId, data);
    } else {
      let data = undefined;
      addOMDbRatingToFirestore(firebaseDocId, data);
    }
  } catch (error) {
    console.log("Error writing to document: ", error);
  }
};

const getRatingAndCreateLabel = async (
  currentResult,
  truncatedTitle,
  firebaseDocId,
  amazonRating
) => {
  const dbDoc = db.collection("media").doc(firebaseDocId);
  try {
    let rating;
    const doc = await dbDoc.get();
    if (doc.exists) {
      const firestoreRating = doc.data().imdbRating;
      if (amazonRating !== undefined) {
        if (amazonRating.length === 1) {
          amazonRating += ".0";
        }
        rating = amazonRating;
        if (amazonRating !== firestoreRating) {
          addAmazonRatingToFirestore(firebaseDocId, amazonRating);
        }
      } else {
        rating = firestoreRating;
      }
      if (rating.includes(".")) {
        createRatingLabel(rating, currentResult);
      }
    } else {
      checkOMDbAndCreateLabel(firebaseDocId, truncatedTitle, currentResult);
    }
  } catch (error) {
    console.log("Error getting document:", error);
  }
};

const addMainResultRatingLabel = (currentResult) => {
  if (currentResult.getElementsByTagName("a").length > 0) {
    let resultTitle = currentResult
      .getElementsByTagName("a")[0]
      .getAttribute("aria-label");
    if (resultTitle) {
      let truncatedTitle = truncateTitle(resultTitle);
      let firebaseDocId = truncatedTitle.toLowerCase().replace(/\+|'/g, "");
      if (
        firebaseDocId.includes("vs.") === false &&
        firebaseDocId.includes("replay:") === false
      ) {
        getRatingAndCreateLabel(currentResult, truncatedTitle, firebaseDocId);
      }
    }
  }
};

const rateMainResults = () => {
  const results = document.getElementsByClassName("tst-title-card");
  for (let i = 0; i < results.length; i++) {
    let rated = results[i].classList.contains("rated");
    if (!rated) {
      results[i].classList.add("rated");
      addMainResultRatingLabel(results[i]);
    }
  }
};

const addSeeMoreResultRatingLabel = (currentResult, amazonRating) => {
  if (currentResult.getElementsByClassName("av-beard-title-link").length > 0) {
    let resultTitle = currentResult.getElementsByClassName(
      "av-beard-title-link"
    )[0].textContent;
    if (resultTitle) {
      let truncatedTitle = truncateTitle(resultTitle);
      let firebaseDocId = truncatedTitle.toLowerCase().replace(/\+|'/g, "");
      if (
        firebaseDocId.includes("vs.") === false &&
        firebaseDocId.includes("replay:") === false
      ) {
        getRatingAndCreateLabel(
          currentResult,
          truncatedTitle,
          firebaseDocId,
          amazonRating
        );
      }
    }
  }
};

const rateSeeMoreResults = () => {
  let results = document.getElementsByClassName("tst-hover-container");
  for (let i = 0; i < results.length; i++) {
    let rated = results[i].classList.contains("rated");
    if (!rated) {
      let amazonRating;
      const amazonRatingLabel = results[i].querySelector(
        ".dv-grid-beard-info > span"
      );
      if (amazonRatingLabel && amazonRatingLabel.innerHTML.includes("IMDb ")) {
        amazonRating = amazonRatingLabel.innerHTML.replace("IMDb ", "");
      }
      results[i].classList.add("rated");
      addSeeMoreResultRatingLabel(results[i], amazonRating);
    }
  }
};

const addSearchResultRatingLabel = (currentResult) => {
  if (currentResult.getElementsByClassName("a-size-medium").length > 0) {
    let resultTitle = currentResult.getElementsByClassName("a-size-medium")[0]
      .textContent;
    if (resultTitle) {
      let truncatedTitle = truncateTitle(resultTitle);
      let firebaseDocId = truncatedTitle.toLowerCase().replace(/\+|'/g, "");
      if (
        firebaseDocId.includes("vs.") === false &&
        firebaseDocId.includes("replay:") === false
      ) {
        getRatingAndCreateLabel(currentResult, truncatedTitle, firebaseDocId);
      }
    }
  }
};

const rateSearchResults = () => {
  let results = document.getElementsByClassName("s-result-item");
  for (let i = 0; i < results.length; i++) {
    addSearchResultRatingLabel(results[i]);
  }
};

const checkDetailPageAmnazonRating = () => {
  const amazonRating = document.querySelector(
    'span[data-automation-id="imdb-rating-badge"]'
  ).innerHTML;
  if (amazonRating) {
    const resultTitle = document.querySelector('h1[data-automation-id="title"]')
      .innerHTML;
    if (resultTitle) {
      const truncatedTitle = truncateTitle(resultTitle);
      const firebaseDocId = truncatedTitle.toLowerCase().replace(/\+|'/g, "");
      addAmazonRatingToFirestore(firebaseDocId, amazonRating);
    }
  }
};

let timer;
let debouncedRateResults = () => {
  if (timer) return;
  timer = setTimeout(() => {
    timer = null;
    rateMainResults();
    rateSeeMoreResults();
  }, 300);
};

if (
  window.location.href.includes("/gp/") ||
  window.location.href.includes("Amazon-Video") ||
  window.location.href.includes("primevideo")
) {
  window.addEventListener("load", rateSeeMoreResults);
  window.addEventListener("scroll", debouncedRateResults);
  window.addEventListener("load", rateMainResults);
  window.addEventListener("click", rateMainResults);
}

if (
  window.location.href.includes("/video/detail") ||
  window.location.href.includes("s=instant-video")
) {
  window.addEventListener("load", checkDetailPageAmnazonRating);
}

let primeSearchResultsVolume = 0;
const lookForPrimeVideoSearchResults = () => {
  let resultLinks = document.getElementsByClassName("a-text-bold");
  for (let i = 0; i < resultLinks.length; i++) {
    if (resultLinks[i].textContent.includes("Prime Video") === true) {
      primeSearchResultsVolume++;
    }
  }
  if (primeSearchResultsVolume > 5) {
    rateSearchResults();
  }
};
document.onload = lookForPrimeVideoSearchResults();
