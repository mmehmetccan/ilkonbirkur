import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { ThumbsUp, ThumbsDown, MessageSquare } from 'lucide-react';
import '../styles/SharedSquads.css';

const SharedSquadsFeed = () => {
    const [squads, setSquads] = useState([]);
    const [loading, setLoading] = useState(true);

    const userInfo = JSON.parse(localStorage.getItem('user'));
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchSquads = async () => {
            try {
                const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/shared-squads`);
                setSquads(response.data);
            } catch (error) {
                console.error("Paylaşılan kadrolar getirilirken hata oluştu:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSquads();
    }, []);

    const handleVote = async (squadId, voteType) => {
        if (!token) {
            alert("Oy vermek için giriş yapmalısınız.");
            return;
        }

        try {
            const response = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/shared-squads/${squadId}/${voteType}`,
                {},
                { headers: { Authorization: `Bearer ${token}` } }
            );

            const updatedSquad = response.data;
            setSquads(prevSquads =>
                prevSquads.map(s => (s._id === squadId ? updatedSquad : s))
            );

        } catch (error) {
            console.error(`${voteType} işlemi sırasında hata:`, error);
            alert("Oylama sırasında bir hata oluştu.");
        }
    };

    if (loading) return <div className="loading-container">Kadrolar yükleniyor...</div>;

    return (
        <div className="squad-feed-container">
            <h1>Paylaşılan Son Kadrolar</h1>

            <div className="squad-feed">
                {squads.length === 0 && (
                    <p className="empty-feed">Henüz hiç kadro paylaşılmamış.</p>
                )}

                {squads.map(squad => (
                    <article key={squad._id} className="squad-post">

                        <div className="post-header">
                            <div className="post-header-info">
                                <h2 className="post-title">
                                    <Link to={`/squads/${squad._id}`}>{squad.title}</Link>
                                </h2>
                                <p className="post-author">
                                    Paylaşan: <strong>{squad.authorName}</strong>
                                </p>
                            </div>
                            <span className="post-formation">{squad.formation}</span>
                        </div>

                        {squad.squadImageUrl && (
                            <Link to={`/squads/${squad._id}`} className="post-image-link">
                                <img
                                    src={squad.squadImageUrl}
                                    alt={squad.title}
                                    className="post-image"
                                />
                            </Link>
                        )}

                        <div className="post-actions">
                            <button
                                className={`action-stat-btn ${squad.likes.includes(userInfo?._id) ? 'active-like' : ''}`}
                                onClick={(e) => { e.preventDefault(); handleVote(squad._id, 'like'); }}
                            >
                                <ThumbsUp size={18} />
                                <span>{squad.likes.length} Beğeni</span>
                            </button>

                            <button
                                className={`action-stat-btn ${squad.dislikes.includes(userInfo?._id) ? 'active-dislike' : ''}`}
                                onClick={(e) => { e.preventDefault(); handleVote(squad._id, 'dislike'); }}
                            >
                                <ThumbsDown size={18} />
                                <span>{squad.dislikes.length}</span>
                            </button>

                            <Link to={`/squads/${squad._id}`} className="action-stat-link">
                                <MessageSquare size={18} />
                                <span>{squad.comments.length} Yorum</span>
                            </Link>

                            <Link to={`/squads/${squad._id}`} className="view-post-link">
                                Kadroyu İncele →
                            </Link>
                        </div>

                    </article>
                ))}
            </div>
        </div>
    );
};

export default SharedSquadsFeed;