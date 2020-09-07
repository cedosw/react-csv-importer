import React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import CardActions from '@material-ui/core/CardActions';
import ChevronLeftIcon from '@material-ui/icons/ChevronLeft';
import ChevronRightIcon from '@material-ui/icons/ChevronRight';

const useStyles = makeStyles((theme) => ({
  mainHeader: {
    display: 'flex',
    alignItems: 'center',
    marginTop: -theme.spacing(2) // cancel out button padding
  },
  mainHeaderSpinner: {
    display: 'flex', // correct inline content placement
    marginLeft: -theme.spacing(1.5),
    padding: theme.spacing(1.5),
    fontSize: theme.spacing(3)
  },
  mainHeaderCrumbSeparator: {
    flex: 'none',
    display: 'flex', // for correct icon alignment
    marginLeft: theme.spacing(1),
    marginRight: theme.spacing(1),
    color: theme.palette.text.disabled
  },
  mainHeaderSubtitle: {
    flex: 'none'
  },
  mainFooterFill: {
    flex: '1 1 0'
  }
}));

export const ImporterFrame: React.FC<{
  fileName: string;
  subtitle?: string; // @todo allow multiple crumbs
  nextDisabled?: boolean;
  nextLabel?: string;
  onNext: () => void;
  onCancel?: () => void;
}> = ({
  fileName,
  subtitle,
  nextDisabled,
  nextLabel,
  onNext,
  onCancel,
  children
}) => {
  const styles = useStyles();

  return (
    <Card variant="outlined">
      <CardContent>
        <div className={styles.mainHeader}>
          {onCancel ? (
            <IconButton onClick={onCancel} edge="start">
              <ChevronLeftIcon />
            </IconButton>
          ) : (
            <div className={styles.mainHeaderSpinner}>
              <CircularProgress size="1em" />
            </div>
          )}

          <Typography variant="subtitle1" color="textPrimary" noWrap>
            {fileName}
          </Typography>

          {subtitle ? (
            <>
              <div className={styles.mainHeaderCrumbSeparator}>
                <ChevronRightIcon fontSize="inherit" />
              </div>
              <div className={styles.mainHeaderSubtitle}>
                <Typography variant="subtitle1" color="textPrimary" noWrap>
                  {subtitle}
                </Typography>
              </div>
            </>
          ) : null}
        </div>

        {children}
      </CardContent>
      <CardActions>
        <div className={styles.mainFooterFill} />
        <Button
          variant="contained"
          color="primary"
          disabled={!!nextDisabled}
          onClick={onNext}
        >
          {nextLabel || 'Next'}
        </Button>
      </CardActions>
    </Card>
  );
};