import React, { useState, useEffect } from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { firestore } from "./Firebase";
import { Link, useNavigate } from "react-router";
import { getAuth, signOut } from "firebase/auth";
import "./style.css";
//STAR Component
const Star = ({ filled, onClick }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    style={{ cursor: "pointer", fill: filled ? "yellow" : "gray" }}
    onClick={onClick}
  >
    <path d="M21.947 9.179a1.001 1.001 0 0 0-.868-.676l-5.701-.453-2.467-5.461a.998.998 0 0 0-1.822-.001L8.622 8.05l-5.701.453a1 1 0 0 0-.619 1.713l4.213 4.107-1.49 6.452a1 1 0 0 0 1.53 1.057L12 18.202l5.445 3.63a1.001 1.001 0 0 0 1.517-1.106l-1.829-6.4 4.536-4.082c.297-.268.406-.686.278-1.065z" />
  </svg>
);
const BCAppDashboard = () => {
  const [book, setBook] = useState([]); //list of books
  const [ratings, setRatings] = useState({}); //user to rate the books
  const [avgRatings, setAvgRatings] = useState({}); //average rating per book
  const [userName, setUserName] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); //serching the input state
  const navigate = useNavigate();
  const auth = getAuth();
  //Jiljo the ratings are not working properly-Amil
  //Fetching Books from Firebase CloudStore
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const collectionRef = collection(firestore, "Books");
        const snapshot = await getDocs(collectionRef);
        const booksData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setBooks(booksData);
        //Calculation for average rating of each book
        const newAvgRatings = {};
        for (const book of booksData) {
          const ratingsObj = book.ratings || {};
          const ratingsArray = Object.values(ratingsObj);
          const total = ratingsArray.reduce((sum, r) => sum + r, 0);
          const avg = ratingsArray.length > 0 ? total / ratingsArray.length : 0;
          newAvgRatings[book.id] = avg;
        }
        setAvgRatings(newAvgRatings);
      } catch (error) {
        console.log("error fetching books:", error);
      }
    };
    fetchBooks();
    //Getting user display name or email
    const user = auth.currentUser;
    if (user) {
      setUserName(user.displayName || user.email || "Anonymous");
    }
  }, []);
  //Signout function
  const handleSignOut = () => {
    signOut(auth).then(() => {
      navigate("/signin");
    });
  };
  //loading the rating for each book for the current user
  const loadUserRatings = async () => {
    const userId = auth.currentUser.uid;
    const updatedRatings = {};
    for (const book of books) {
      const ratingsObj = book.ratings || {};
      const userRatings = ratingsObj[userId] || 0;
      updatedRatings[book.id] = userRatings;
    }
    setRatings(updatedRatings);
  };
  //Reloading the user ratings when books are fetched or user changes
  useEffect(() => {
    if (books.length > 0 && auth.currentUser) {
      loadUserRatings();
    }
  }, [books]);
  const handleStarClick = async (bookId, starIndex) => {
    const userId = auth.currentUser.uid;
    setRatings((prev) => ({ ...prev, [bookId]: starIndex }));
    //store the ratings on Firestore
    const bookRef = doc(firestore, "Books", bookId);
    try {
      await updateDoc(bookRef, {
        [`ratings.${userId}`]: starIndex,
      });
      //update the avaerage ratings after saving
      const updatedBook = (await bookRef.get()).data();
      const ratingsObj = updatedBook.ratings || {};
      const ratingsArray = Object.values(ratingsObj);
      const total = ratingsArray.reduce((sum, r) => sum + r, 0);
      const avg = ratingsArray.length > 0 ? total / ratingsArray.length : 0;
      setAvgRatings((prev) => ({ ...prev, [bookId]: avg }));
    } catch (err) {
      console.log("Error while updating the Ratings in Firestore", err);
    }
  };
  //Filter Books based on search term
  const filteredBooks = books.filter(
    (book) =>
      (book.title &&
        book.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (book.author &&
        book.author.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (book.Sno && book.Sno.toString().includes(searchTerm))
  );
  return (
    <>
      <div className="dashboard">
        <h1>Welcome to Chat App</h1>
        {/*Displaying the user name */}
        <p className="welcome-message">Hello, {userName}</p>
        {/*Search Input box */}
        <input
          type="text"
          placeholder="Search Books/author"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={{
            padding: "10px",
            marginBottom: "20px",
            width: "100%",
            fontSize: " 1.6rem",
            borderRadius: "5px",
            border: " 1px solid #ccc",
          }}
        />
        {/*Book List Headder*/}
        <div className="header">
          <h2>Book List</h2>
          <button onClick={handleSignOut} className="signout-button1">
            Sign Out
          </button>
        </div>
        {/*Display filtered books*/}
        {filteredBooks.length === 0 ? (
          <p>No Books Available</p>
        ) : (
          filteredBooks.map((book) => (
            <div key={book.id} className="book-item">
              <h3 className="book-title">
                {book.Sno || "serial Number"} {"     "}
                {book.title || "untitled"}
                {"        "} {book.author || "anonymous"}
              </h3>
              {/*Displaying the average rating for the books */}
              <p>Average Rating:{avgRatings[book.id]?.toFixed(1) || "N/A"}</p>
              {/*user ratings star*/}
              <div style={{ display: "flex", gap: "7px" }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    filled={ratings[book.id] >= star}
                    onClick={() => handleStarClick(book.id, star)}
                  />
                ))}
              </div>
              <Link className="join-link" to={`/books/${book.id}`}>
                Join Discussion
              </Link>
            </div>
          ))
        )}
      </div>
    </>
  );
};
export default BCAppDashboard;
