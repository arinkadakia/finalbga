import React, { useState, useEffect } from "react";
import {
  Typography,
  Grid,
  Paper,
  TextField,
  Button,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress,
  Chip,
  makeStyles,
  Box,
  Link,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Snackbar,
} from "@material-ui/core";
import SearchIcon from "@material-ui/icons/Search";
import MenuBookIcon from "@material-ui/icons/MenuBook";
import FormatQuoteIcon from "@material-ui/icons/FormatQuote";
import NoteAddIcon from "@material-ui/icons/NoteAdd";
import EditIcon from "@material-ui/icons/Edit";
import DeleteIcon from "@material-ui/icons/Delete";
import { literatureAPI } from "../services/api";
import Alert from "@material-ui/lab/Alert";
import PersonIcon from "@material-ui/icons/Person";
import LinkIcon from "@material-ui/icons/Link";
import CopyrightIcon from "@material-ui/icons/Copyright";
import AttachMoneyIcon from "@material-ui/icons/AttachMoney";
import BusinessIcon from "@material-ui/icons/Business";

const useStyles = makeStyles((theme) => ({
  root: {
    flexGrow: 1,
    padding: theme.spacing(3),
  },
  title: {
    marginBottom: theme.spacing(4),
    fontWeight: 500,
  },
  paper: {
    padding: theme.spacing(3),
    height: "100%",
  },
  searchBar: {
    marginBottom: theme.spacing(3),
  },
  searchButton: {
    height: 56,
    marginLeft: theme.spacing(1),
  },
  articleItem: {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    borderLeft: `3px solid ${theme.palette.primary.main}`,
    transition: "all 0.2s",
    "&:hover": {
      backgroundColor: "#f5f5f5",
      transform: "translateX(5px)",
    },
  },
  articleTitle: {
    fontWeight: 500,
  },
  articleInfo: {
    display: "flex",
    justifyContent: "space-between",
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    color: theme.palette.text.secondary,
    fontSize: "0.875rem",
  },
  abstractText: {
    marginTop: theme.spacing(1),
    marginBottom: theme.spacing(1),
    fontSize: "0.9rem",
    lineHeight: 1.6,
  },
  chip: {
    margin: theme.spacing(0.5),
  },
  progress: {
    display: "flex",
    justifyContent: "center",
    margin: theme.spacing(4, 0),
  },
  iconSpacing: {
    marginRight: theme.spacing(1),
  },
  articleDetail: {
    padding: theme.spacing(3),
  },
  articleDetailTitle: {
    marginBottom: theme.spacing(2),
  },
  divider: {
    margin: theme.spacing(2, 0),
  },
  citation: {
    fontStyle: "italic",
    marginBottom: theme.spacing(2),
  },
  abstractTitle: {
    marginTop: theme.spacing(2),
    marginBottom: theme.spacing(1),
    fontWeight: 500,
  },
  emptyState: {
    textAlign: "center",
    padding: theme.spacing(6),
  },
  emptyStateIcon: {
    fontSize: 64,
    color: theme.palette.text.disabled,
    marginBottom: theme.spacing(2),
  },
  metadataChip: {
    margin: theme.spacing(0.5),
    backgroundColor: theme.palette.success.light,
    color: theme.palette.success.contrastText,
  },
  fundingInfo: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.shape.borderRadius,
  },
  institutionInfo: {
    marginTop: theme.spacing(2),
    padding: theme.spacing(2),
    backgroundColor: theme.palette.grey[100],
    borderRadius: theme.shape.borderRadius,
  },
  qualityIndicator: {
    display: "flex",
    alignItems: "center",
    marginTop: theme.spacing(1),
    "& svg": {
      marginRight: theme.spacing(0.5),
    },
  },
}));

const LiteratureExplorer = ({ addGlobalNote }) => {
  const classes = useStyles();
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [error, setError] = useState(null);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const articlesPerPage = 10;

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearch = async (page = 1) => {
    if (!searchQuery.trim()) {
      setError("Please enter a search query.");
      return;
    }

    setLoading(true);
    setSelectedArticle(null);
    setError(null);
    setCurrentPage(page);

    try {
      const response = await literatureAPI.searchLiterature(searchQuery, {
        limit: articlesPerPage,
        page: page,
      });

      if (response.data && response.data.results) {
        setArticles(response.data.results);
        setTotalResults(response.data.total);
      } else {
        setArticles([]);
        setTotalResults(0);
      }
    } catch (err) {
      console.error("Error searching literature:", err);
      setError(
        err.response?.data?.error ||
          "Failed to search literature. Please try again later."
      );
      setArticles([]);
      setTotalResults(0);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleArticleSelect = async (article) => {
    setSelectedArticle(article);
  };

  const handleAnalyzeArticle = async () => {
    if (!selectedArticle) return;
    setAnalysisLoading(true);
    setError(null);
    try {
      const query = `Summarize the key findings and relevance to ADHD drug discovery from this article titled "${selectedArticle.title}". Provide a concise summary suitable for a research note.`;
      const response = await literatureAPI.analyzeLiterature(
        [selectedArticle],
        query
      );

      const analysisContent = response.data.analysis;

      if (analysisContent) {
        addGlobalNote({
          title: `AI Summary: ${selectedArticle.title}`,
          content: analysisContent,
        });
        setSnackbarMessage("AI analysis added to global notes.");
        setSnackbarOpen(true);
      } else {
        throw new Error("AI analysis did not return content.");
      }
    } catch (err) {
      console.error("Error analyzing article:", err);
      const errorMsg =
        err.response?.data?.details ||
        err.message ||
        "Failed to analyze article or AI did not return a summary.";
      setError(errorMsg);
      setSnackbarMessage(`Error: ${errorMsg}`);
      setSnackbarOpen(true);
    } finally {
      setAnalysisLoading(false);
    }
  };

  const handleBackToResults = () => {
    setSelectedArticle(null);
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === "clickaway") {
      return;
    }
    setSnackbarOpen(false);
  };

  return (
    <div className={classes.root}>
      <Typography variant="h4" className={classes.title}>
        Literature Explorer
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper className={classes.paper}>
            <Grid container className={classes.searchBar}>
              <Grid item xs>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Search for research papers..."
                  value={searchQuery}
                  onChange={handleSearchChange}
                  onKeyPress={handleKeyPress}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  className={classes.searchButton}
                  onClick={handleSearch}
                  disabled={loading}
                >
                  Search
                </Button>
              </Grid>
            </Grid>

            {error && (
              <Alert severity="error" style={{ marginBottom: 16 }}>
                {error}
              </Alert>
            )}

            {loading ? (
              <div className={classes.progress}>
                <CircularProgress />
              </div>
            ) : selectedArticle ? (
              <div className={classes.articleDetail}>
                <Button color="primary" onClick={handleBackToResults}>
                  ← Back to results
                </Button>

                <Typography variant="h5" className={classes.articleDetailTitle}>
                  {selectedArticle.title}
                </Typography>

                <Box display="flex" flexWrap="wrap" mt={2} mb={2}>
                  {selectedArticle.metadata.hasAbstract && (
                    <Chip
                      icon={<FormatQuoteIcon />}
                      label="Has Abstract"
                      className={classes.metadataChip}
                    />
                  )}
                  {selectedArticle.metadata.hasAuthors && (
                    <Chip
                      icon={<PersonIcon />}
                      label="Has Authors"
                      className={classes.metadataChip}
                    />
                  )}
                  {selectedArticle.metadata.hasReferences && (
                    <Chip
                      icon={<LinkIcon />}
                      label="Has References"
                      className={classes.metadataChip}
                    />
                  )}
                  {selectedArticle.metadata.hasLicense && (
                    <Chip
                      icon={<CopyrightIcon />}
                      label="Has License"
                      className={classes.metadataChip}
                    />
                  )}
                  {selectedArticle.metadata.hasFunding && (
                    <Chip
                      icon={<AttachMoneyIcon />}
                      label="Has Funding"
                      className={classes.metadataChip}
                    />
                  )}
                  {selectedArticle.metadata.hasInstitution && (
                    <Chip
                      icon={<BusinessIcon />}
                      label="Has Institution"
                      className={classes.metadataChip}
                    />
                  )}
                </Box>

                <Typography variant="subtitle2" gutterBottom>
                  Authors: {selectedArticle.authors}
                </Typography>
                <Typography variant="body2" className={classes.citation}>
                  {selectedArticle.journal} ({selectedArticle.publicationYear})
                  {selectedArticle.doi && (
                    <>
                      {" "}
                      | DOI:{" "}
                      <Link
                        href={`https://doi.org/${selectedArticle.doi}`}
                        target="_blank"
                        rel="noopener"
                      >
                        {selectedArticle.doi}
                      </Link>
                    </>
                  )}
                </Typography>

                <Divider className={classes.divider} />

                {selectedArticle.abstract && (
                  <>
                    <Typography
                      variant="subtitle1"
                      className={classes.abstractTitle}
                    >
                      Abstract
                    </Typography>
                    <Typography variant="body1" paragraph>
                      <FormatQuoteIcon
                        fontSize="small"
                        className={classes.iconSpacing}
                      />
                      {selectedArticle.abstract}
                    </Typography>
                  </>
                )}

                {selectedArticle.funders &&
                  selectedArticle.funders.length > 0 && (
                    <div className={classes.fundingInfo}>
                      <Typography variant="subtitle1" gutterBottom>
                        Funding Information
                      </Typography>
                      {selectedArticle.funders.map((funder, index) => (
                        <Typography key={index} variant="body2">
                          {funder.name} {funder.award && `- ${funder.award}`}
                        </Typography>
                      ))}
                    </div>
                  )}

                {selectedArticle.institutions &&
                  selectedArticle.institutions.length > 0 && (
                    <div className={classes.institutionInfo}>
                      <Typography variant="subtitle1" gutterBottom>
                        Institution Information
                      </Typography>
                      {selectedArticle.institutions.map(
                        (institution, index) => (
                          <Typography key={index} variant="body2">
                            {institution.name}{" "}
                            {institution.place && `- ${institution.place}`}
                          </Typography>
                        )
                      )}
                    </div>
                  )}

                <Box mt={2} mb={2}>
                  <Button
                    variant="contained"
                    color="secondary"
                    onClick={handleAnalyzeArticle}
                    disabled={analysisLoading}
                    style={{ marginRight: 16 }}
                  >
                    {analysisLoading ? (
                      <CircularProgress size={24} />
                    ) : (
                      "Analyze & Add Note"
                    )}
                  </Button>
                </Box>
              </div>
            ) : articles.length > 0 ? (
              <List>
                {articles.map((article) => (
                  <Paper
                    key={article.doi}
                    className={classes.articleItem}
                    onClick={() => handleArticleSelect(article)}
                    elevation={1}
                  >
                    <Typography variant="h6" className={classes.articleTitle}>
                      {article.title}
                    </Typography>

                    <div className={classes.articleInfo}>
                      <Typography variant="body2">{article.authors}</Typography>
                      <Typography variant="body2">
                        {article.journal} ({article.publicationYear})
                      </Typography>
                    </div>

                    <Typography
                      variant="body2"
                      className={classes.abstractText}
                      style={{
                        maxHeight: "60px",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        display: "-webkit-box",
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: "vertical",
                      }}
                    >
                      {article.abstract}
                    </Typography>
                  </Paper>
                ))}
              </List>
            ) : (
              <div className={classes.emptyState}>
                <MenuBookIcon className={classes.emptyStateIcon} />
                <Typography variant="h6" color="textSecondary">
                  Search for literature
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Enter keywords to search for research papers
                </Typography>
              </div>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        message={snackbarMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
      />
    </div>
  );
};

export default LiteratureExplorer;
