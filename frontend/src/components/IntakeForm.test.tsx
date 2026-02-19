import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IntakeForm from './IntakeForm';

function mockFetchResponse(data: unknown, ok = true) {
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok,
    json: async () => data,
  } as Response);
}

describe('IntakeForm', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders success state and timeline from API', async () => {
    mockFetchResponse({
      status: 'valid',
      user_state: {
        degree_level: 'Master',
        is_stem_degree: true,
        program_end_date: '2026-05-13',
        opt_stage: 'Post',
        unemployment_days_used: 0,
      },
      timeline: {
        earliest_filing: '2026-02-12',
        program_end: '2026-05-13',
        latest_filing: '2026-07-12',
        grace_period_end: '2026-07-12',
      },
      timeline_message: null,
      rag_warning: null,
      rag_context: [],
    });

    render(<IntakeForm />);
    await userEvent.click(screen.getByRole('button', { name: /validate eligibility/i }));

    expect(await screen.findByText(/validation successful/i)).toBeInTheDocument();
    expect(screen.getByText('OPT Timeline')).toBeInTheDocument();
    expect(screen.getByText('05/13/2026')).toBeInTheDocument();
  });

  it('renders validation errors from API', async () => {
    mockFetchResponse(
      {
        detail: {
          status: 'invalid',
          errors: [{ field: 'program_end_date', message: 'Program end date is invalid.' }],
        },
      },
      false,
    );

    render(<IntakeForm />);
    await userEvent.click(screen.getByRole('button', { name: /validate eligibility/i }));

    expect(await screen.findByText(/validation failed/i)).toBeInTheDocument();
    expect(screen.getByText(/program end date is invalid/i)).toBeInTheDocument();
  });

  it('calls validate endpoint', async () => {
    mockFetchResponse({
      status: 'valid',
      user_state: {
        degree_level: 'Master',
        is_stem_degree: false,
        program_end_date: '',
        opt_stage: 'Post',
        unemployment_days_used: 0,
      },
      timeline: null,
      timeline_message: null,
      rag_warning: null,
      rag_context: [],
    });

    render(<IntakeForm />);
    await userEvent.click(screen.getByRole('button', { name: /validate eligibility/i }));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledTimes(1);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://localhost:8000/validate',
        expect.objectContaining({ method: 'POST' }),
      );
    });
  });
});
