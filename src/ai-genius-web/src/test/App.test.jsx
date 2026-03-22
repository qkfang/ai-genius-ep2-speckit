import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';

const mockStatus = { status: 'running', speckit: { enabled: true, version: '1.0.0' } };
const mockSeries = {
  name: 'Microsoft AI Genius',
  season: 4,
  description: 'Season 4 of Microsoft AI Genius.',
  topics: [
    { episode: 1, title: 'Getting Started with Microsoft Agent Framework', presenter: 'Rakesh L', status: 'available' },
    { episode: 2, title: 'Agentic DevOps with SpecKit', presenter: 'Daniel Fang', status: 'available' },
    { episode: 3, title: 'Build Your Own Dev Experience Upgrades', presenter: 'Renee Noble', status: 'available' },
  ],
};

beforeEach(() => {
  vi.restoreAllMocks();
});

describe('App', () => {
  it('shows a loading indicator initially', () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ json: () => new Promise(() => {}) });

    render(<App />);

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('renders the header title', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockStatus) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockSeries) });

    render(<App />);

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Microsoft AI Genius');
  });

  it('renders all three episodes after data loads', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockStatus) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockSeries) });

    render(<App />);

    await waitFor(() => expect(screen.queryByText('Loading...')).not.toBeInTheDocument());

    expect(screen.getByText('Ep 1')).toBeInTheDocument();
    expect(screen.getByText('Ep 2')).toBeInTheDocument();
    expect(screen.getByText('Ep 3')).toBeInTheDocument();
  });

  it('shows the SpecKit badge on episode 2', async () => {
    vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockStatus) })
      .mockResolvedValueOnce({ json: () => Promise.resolve(mockSeries) });

    render(<App />);

    await waitFor(() => screen.getByText('Ep 2'));

    const episode2Card = screen.getByText('Ep 2').closest('.episode-card');
    expect(episode2Card).toHaveClass('episode-card--speckit');
    expect(episode2Card.querySelector('.speckit-ep-badge')).not.toBeNull();
  });

  it('shows an error message when the backend is unreachable', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValue(new Error('Network Error'));

    render(<App />);

    await waitFor(() => screen.getByText(/Could not reach backend/i));

    expect(screen.getByText(/Network Error/i)).toBeInTheDocument();
  });
});
