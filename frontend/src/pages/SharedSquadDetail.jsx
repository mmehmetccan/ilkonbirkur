import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useParams, Link } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, ArrowLeft } from 'lucide-react';
import '../styles/SharedSquads.css';

const SharedSquadDetail = () => {
    const { id } = useParams();
    const [squad, setSquad] = useState(null);
    const [loading, setLoading] = useState(true);
    const [commentText, setCommentText] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const userInfo = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    useEffect(() => {
        fetchSquadDetail();
    }, [id]);

    const fetchSquadDetail = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/shared-squads/${id}`);
            setSquad(response.data);
        } catch (error) {
            console.error("Kadro detayı getirilirken hata:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleVote = async (voteType) => {
        if (!token) {
            alert("Oy vermek için giriş yapmalısınız.");
            return;
        }
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/shared-squads/${id}/${voteType}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSquad(response.data);
        } catch (error) {
            console.error(`${voteType} işlemi sırasında hata:`, error);
        }
    };

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;
        if (!token) {
            alert("Yorum yapmak için giriş yapmalısınız.");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/shared-squads/${id}/comment`, { text: commentText }, {
                headers: { Authorization: `Bearer ${token}` }
            });
            setSquad(response.data);
            setCommentText("");
        } catch (error) {
            console.error("Yorum eklenirken hata:", error);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) return <div className="loading-container">Kadro yükleniyor...</div>;
    if (!squad) return <div>Kadro bulunamadı.</div>;

    return (
        <div className="squad-detail-container">

            <Link to="/squads" className="back-to-feed-link">
                <ArrowLeft size={18} />
                <span>Geri Dön</span>
            </Link>

            <div className="detail-header">
                <h1>{squad.title}</h1>
                <p className="author">Paylaşan: <strong>{squad.authorName}</strong> - Formasyon: <strong>{squad.formation}</strong></p>
                {squad.description && <p className="description">"{squad.description}"</p>}
            </div>

            <div className="detail-field-container">
                {squad.squadImageUrl ? (
                    <img
                        src={squad.squadImageUrl}
                        alt={squad.title}
                        className="squad-detail-image"
                    />
                ) : (
                    <p>Kadro görseli bulunamadı.</p>
                )}
            </div>

            <div className="interaction-section">
                <div className="vote-buttons">
                    <button onClick={() => handleVote('like')} className={`vote-btn like ${squad.likes.includes(userInfo?._id) ? 'active' : ''}`}>
                        <ThumbsUp /> <span>{squad.likes.length}</span>
                    </button>
                    <button onClick={() => handleVote('dislike')} className={`vote-btn dislike ${squad.dislikes.includes(userInfo?._id) ? 'active' : ''}`}>
                        <ThumbsDown /> <span>{squad.dislikes.length}</span>
                    </button>
                </div>

                <div className="comments-section">
                    <h3>Yorumlar ({squad.comments.length})</h3>
                    {token ? (
                        <form onSubmit={handleCommentSubmit} className="comment-form">
                            <textarea
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Yorumunu yaz..."
                                rows="3"
                            ></textarea>
                            <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Gönderiliyor...' : 'Gönder'}</button>
                        </form>
                    ) : (
                        <p className="login-prompt">Yorum yapmak için <Link to="/login">giriş yapmalısınız</Link>.</p>
                    )}

                    <div className="comments-list">
                        {squad.comments.slice().reverse().map(comment => (
                            <div key={comment._id} className="comment-item">
                                <p className="comment-text">{comment.text}</p>
                                <p className="comment-meta">
                                    <strong>{comment.username}</strong> - {new Date(comment.createdAt).toLocaleString('tr-TR')}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SharedSquadDetail;